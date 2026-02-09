
Hugging Face Spaces — інструкція (без Docker)

Кроки для розгортання цього репозиторію як Gradio Space:

1) У корені репозиторію виконайте:

    - Скопіюйте `space_requirements.txt` в `requirements.txt` (Spaces читає `requirements.txt`):

       ```bash
       cp space_requirements.txt requirements.txt
       ```

2) Додайте в Settings вашого Space секрет:

    - Назва: `GOOGLE_API_KEY`
    - Значення: ваш API-ключ Google GenAI (Gemini)

3) У Hugging Face при створенні Space оберіть тип: `Gradio`.

4) Переконайтесь, що у репозиторії є `app.py` (він вже доданий) — Hugging Face автоматично запустить Gradio з `app.py`.

5) Додаткові нотатки:

- Цей `app.py` — мінімальна обгортка для виклику Gemini і демонстрації інтерфейсу. Він НЕ ініціалізує повний Flask бекенд вашого проєкту (щоб уникнути помилок при відсутності БД/Redis).
- Якщо ви хочете розгорнути повну аплікацію (фронтенд + API), потрібен Docker або окремий хостинг для бекенду.
- Для локального тестування встановіть `gradio` і `google-genai` та запустіть:

   ```bash
   pip install -r space_requirements.txt
   python app.py
   ```

Швидка інструкція для розгортання як Gradio Space (коротка версія з сайту Hugging Face, адаптована):

1) Клон репозиторію (якщо ви працюєте локально). Коли буде запит пароля, використайте Access Token з правами запису:

```bash
# Згенеруйте токен тут: https://huggingface.co/settings/tokens
git clone https://huggingface.co/spaces/VladislavMorgan/freedom13
```

2) Переконайтесь, що встановлено `hf` CLI (опціонально — для завантаження/синхронізації):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://hf.co/cli/install.ps1 | iex"
# або у bash: curl -s https://hf.co/cli | bash
```

3) (Опціонально) Завантажити Space локально через `hf`:

```bash
hf download VladislavMorgan/freedom13 --repo-type=space
```

4) Створіть або підтвердіть наявність `app.py` у корені — приклад Gradio додатку:

```python
import gradio as gr

def greet(name):
      return "Hello " + name + "!!"

demo = gr.Interface(fn=greet, inputs="text", outputs="text")
demo.launch()
```

У цьому репозиторії вже додано `app.py` — мінімальну обгортку MikuGPT/GenAI для Spaces.

5) Додайте залежності: створіть або оновіть `requirements.txt` у корені репозиторію. У цьому репо є `space_requirements.txt` з мінімальними пакетами (`gradio`, `google-genai`). Ви можете або вручну об'єднати в `requirements.txt`, або скопіювати:

```bash
cp space_requirements.txt requirements.txt
```

6) Додайте секрети в Settings вашого Space на Hugging Face:

- `GOOGLE_API_KEY` — ваш API-ключ Google GenAI (Gemini)

7) Commit & push (якщо робите локальні зміни):

```bash
git add app.py requirements.txt
git commit -m "Add Gradio app for HF Spaces"
git push
```

Альтернатива: ви можете створити або редагувати `app.py` прямо в інтерфейсі Hugging Face (Create file) і натиснути Commit.

8) Нотатки про залежності та системні пакети:

- Ви можете додати `packages.txt` у корінь для Debian-пакетів, якщо потрібні системні бібліотеки.
- `gradio` зазвичай передвстановлено у середовищі Spaces; версія контролюється через `sdk_version` у `README.md` метаданих Space.

9) Персоналізація Space:

- Налаштуйте emoji, кольори, опис і метадані через `README.md` у корені репозиторію (цей файл також відображається на сторінці Space).

10) Документація:

- Повна документація Gradio Spaces: https://gradio.app/docs/spaces

Пояснення для цього репозиторію

- У репозиторії `app.py` — легкий Gradio wrapper, що викликає Google GenAI (при наявності `GOOGLE_API_KEY`).
- Це не запускає повний Flask бекенд з БД/Redis/чергою — для повного бекенду потрібен окремий хостинг або Docker.

Локальне тестування:

```bash
pip install -r space_requirements.txt
python app.py
```

Якщо хочете, я можу автоматично замінити кореневий `requirements.txt` на `space_requirements.txt` і підготувати гілку для HF. Якщо ні — зробіть це вручну або через UI Hugging Face.

Кроки для розгортання цього репозиторію як Gradio Space:

1) У корені репозиторію виконайте:

   - Скопіюйте `space_requirements.txt` в `requirements.txt` (Spaces читає `requirements.txt`):

     ```bash
     cp space_requirements.txt requirements.txt
     ```

2) Додайте в Settings вашого Space секрет:

   - Назва: `GOOGLE_API_KEY`
   - Значення: ваш API-ключ Google GenAI (Gemini)

3) У Hugging Face при створенні Space оберіть тип: `Gradio`.

4) Переконайтесь, що у репозиторії є `app.py` (він вже доданий) — Hugging Face автоматично запустить Gradio з `app.py`.

5) Додаткові нотатки:

- Цей `app.py` — мінімальна обгортка для виклику Gemini і демонстрації інтерфейсу. Він НЕ ініціалізує повний Flask бекенд вашого проєкту (щоб уникнути помилок при відсутності БД/Redis).
- Якщо ви хочете розгорнути повну аплікацію (фронтенд + API), потрібен Docker або окремий хостинг для бекенду.
- Для локального тестування встановіть `gradio` і `google-genai` та запустіть:

  ```bash
  pip install -r space_requirements.txt
  python app.py
  ```
