# 🔧 Встановлення Rust для Pydantic

Якщо ви хочете використовувати `pydantic` для валідації (опціонально), потрібно встановити Rust.

## Windows

### Варіант 1: Офіційний rustup (рекомендовано)

1. Завантажте та запустіть: https://rustup.rs/
2. Виберіть "Default installation"
3. Перезапустіть PowerShell/Terminal
4. Перевірте: `rustc --version` та `cargo --version`

### Варіант 2: Через Chocolatey

```powershell
choco install rust
```

### Після встановлення Rust:

```bash
pip install -r requirements-optional.txt
```

## Linux/Mac

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
pip install -r requirements-optional.txt
```

---

**Примітка:** Pydantic не обов'язковий для роботи проекту. Проект працює без нього.
