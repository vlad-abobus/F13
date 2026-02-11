import os
import logging
try:
    from google import genai
except Exception:
    genai = None

try:
    import gradio as gr
except Exception:
    gr = None

logger = logging.getLogger(__name__)

PERSONALITIES = [
    "Дередере",
    "Цундере",
    "Дандере",
    "Яндере",
]


def _build_system_prompt(personality: str) -> str:
    return f"""
Ты — MikuGPT, виртуальная помощница и персонаж с заданной личностью.
Отвечай коротко, в характере {personality}, используй эмодзи уместно.
Возвращай человеческий текст — без лишних технических деталей.
""".strip()


def generate_response(message: str, personality: str = "Дередере") -> str:
    """Простой генератор ответа, использующий Google GenAI (Gemini).

    Требуется установить переменную окружения `GOOGLE_API_KEY` в настройках Space.
    """
    if genai is None:
        return "ERROR: google-genai не встановлено. Додайте 'google-genai' в requirements."

    api_key = os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        return "ERROR: GOOGLE_API_KEY не встановлено в змінних середовища."

    client = genai.Client(api_key=api_key)
    system_prompt = _build_system_prompt(personality)
    prompt = system_prompt + "\n\n" + message

    try:
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = getattr(resp, 'text', None) or getattr(resp, 'output', None) or str(resp)
        return text
    except Exception as e:
        logger.exception("Gemini call failed")
        return f"ERROR: Помилка при виклику Gemini: {type(e).__name__}: {e}"


if __name__ == '__main__':
    # Локальний сервер для відлагодження
    if gr is None:
        print("ERROR: gradio не встановлено. Встановіть gradio для запуску локально.")
        raise SystemExit(1)

    import threading
    import time
    import requests

    flask_port = int(os.environ.get('FLASK_PORT', os.environ.get('PORT', '5000')))
    
    # Спроба запустити Flask бекенд у фоновому потоці
    def _start_flask_backend():
        try:
            # За замовчуванням не ініціалізується БД/додаткові сервіси у Spaces
            # Для запуску повного бекенду (БД/Redis/і т.д.) встановіть START_FULL_BACKEND=true
            start_full = os.environ.get('START_FULL_BACKEND', '').lower() in ('1', 'true', 'yes')
            if not start_full:
                os.environ.setdefault('SKIP_INIT_DB', '1')
            else:
                # Переконайтесь, що SKIP_INIT_DB не встановлено, коли користувач запросив повний бекенд
                os.environ.pop('SKIP_INIT_DB', None)

            # Дозвольте перевизначити порт
            from config import Config
            from app import create_app
            flask_app = create_app(Config)
            # Запустіть додаток Flask на localhost, щоб Gradio міг вбудовувати його
            flask_app.run(host='127.0.0.1', port=flask_port, threaded=True, use_reloader=False)
        except Exception as e:
            logger.exception(f"Не вдалося запустити бекенд Flask: {e}")

    # Запustите Flask у фоновому потоці
    flask_thread = threading.Thread(target=_start_flask_backend, daemon=True)
    flask_thread.start()
    
    # Дайте Flask більше часу на запуск (4 секунди)
    print("⏳ Очікування запуску Flask бекенду...")
    for i in range(4):
        time.sleep(1)
        try:
            resp = requests.get(f'http://127.0.0.1:{flask_port}/api/health', timeout=1)
            if resp.status_code == 200:
                print(f"✅ Flask запустився на порту {flask_port}")
                break
        except:
            pass
    else:
        print(f"⚠️ Flask може не запуститися. Перевірте БД та Redis налаштування.")

    # Побудуємо UI Gradio з двома вкладками: Сайт (iframe) та Чатбот
    with gr.Blocks(title="Freedom13") as demo:
        gr.Markdown("# Freedom13 — Веб-платформа\n\nВиберіть вкладку нижче.", show_label=False)
        
        with gr.Tabs():
            with gr.TabItem("🌐 Сайт", id="site"):
                gr.HTML(f'''
                <div style="width:100%; height:900px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <iframe 
                        src="http://127.0.0.1:{flask_port}/" 
                        style="width:100%; height:100%; border:0; display:block;"
                        title="Freedom13 Веб-сайт"
                    ></iframe>
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    💡 Якщо сайт не завантажується, переконайтесь, що Flask запустився та БД доступна.
                </p>
                ''')
            
            with gr.TabItem("🤖 Чатбот", id="chatbot"):
                gr.Markdown("## MikuGPT — AI Асистентка")
                with gr.Row():
                    msg = gr.Textbox(lines=6, label="Повідомлення", placeholder="Введіть вашу думку...")
                    pers = gr.Dropdown(
                        PERSONALITIES, 
                        value=PERSONALITIES[0], 
                        label="Особистість",
                        info="Виберіть тип особистості MikuGPT"
                    )
                out = gr.Textbox(lines=8, label="Відповідь Мику", interactive=False)
                btn = gr.Button("🎯 Відправити", variant="primary")

                def _on_click(m, p):
                    return generate_response(m or "", p or PERSONALITIES[0])

                btn.click(_on_click, inputs=[msg, pers], outputs=out)

    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
