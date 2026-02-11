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
import threading
import time

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
    # Local debug server
    if gr is None:
        print("ERROR: gradio not installed. Install gradio to run locally.")
        raise SystemExit(1)
    # Попытка запустить бекенд Flask в фоновом потоке
    def _start_flask_backend():
        try:
            # По умолчанию не инициализируем БД/дополнительные сервисы в Spaces
            # Для запуска полного бекенда (БД/Redis/и т.д.) установите START_FULL_BACKEND=true
            start_full = os.environ.get('START_FULL_BACKEND', '').lower() in ('1', 'true', 'yes')
            if not start_full:
                os.environ.setdefault('SKIP_INIT_DB', '1')
            else:
                # Убеждаетесь, что SKIP_INIT_DB не установлен, когда пользователь запросил полный бекенд
                os.environ.pop('SKIP_INIT_DB', None)

            # Разрешите переопределить порт
            flask_port = int(os.environ.get('FLASK_PORT', os.environ.get('PORT', '5000')))
            from config import Config
            from app import create_app
            flask_app = create_app(Config)
            # Запустите приложение Flask на localhost, чтобы Gradio мог встроить его
            flask_app.run(host='127.0.0.1', port=flask_port, threaded=True)
        except Exception:
            logger.exception("Не удалось запустить бекенд Flask")

    threading.Thread(target=_start_flask_backend, daemon=True).start()
    # Дайте Flask немного времени на запуск
    time.sleep(1)

    # Создаем UI Gradio с двумя вкладками: Сайт (iframe) и Чатбот
    with gr.Blocks() as demo:
        gr.Markdown("# Freedom13 — обёртка Gradio\n\nИспользуйте вкладку 'Сайт' для просмотра полного фронтенда, обслуживаемого бекенду Flask.")
        with gr.Tabs():
            with gr.TabItem("Сайт"):
                flask_port = int(os.environ.get('FLASK_PORT', os.environ.get('PORT', '5000')))
                src = f"http://127.0.0.1:{flask_port}/"
                gr.HTML(f'<iframe src="{src}" style="width:100%; height:800px; border:0;"></iframe>')
            with gr.TabItem("Чатбот"):
                gr.Markdown("## MikuGPT — Чатбот")
                with gr.Row():
                    msg = gr.Textbox(lines=6, label="Message")
                    pers = gr.Dropdown(PERSONALITIES, value=PERSONALITIES[0], label="Personality")
                out = gr.Textbox(lines=8, label="Miku response")
                btn = gr.Button("Generate")

                def _on_click(m, p):
                    return generate_response(m or "", p or PERSONALITIES[0])

                btn.click(_on_click, inputs=[msg, pers], outputs=out)

    demo.launch(server_name="0.0.0.0", share=False)
