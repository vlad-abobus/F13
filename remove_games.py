#!/usr/bin/env python3
"""
Видалити лишні ігри з бази даних
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app, db
    from app.models.flash_game import FlashGame
except ImportError as e:
    print(f"[ERROR] Import error: {e}")
    print("[INFO] Trying with environment variables...")
    import dotenv
    dotenv.load_dotenv()
    from app import create_app, db
    from app.models.flash_game import FlashGame

def main():
    print("[*] Starting game removal script...")
    app = create_app()
    
    with app.app_context():
        # Спочатку показати всі ігри
        all_games = FlashGame.query.all()
        print(f"\n[INFO] Поточно в БД {len(all_games)} ігр:")
        for game in all_games:
            print(f"  - {game.title}")
        
        # Видалити лишні ігри
        games_to_remove = ['Tetris', 'Snake', 'Pac-Man', 'pac-man', 'OPacman', 'PAC-MAN']
        removed_count = 0
        
        for game_name in games_to_remove:
            game = FlashGame.query.filter_by(title=game_name).first()
            if game:
                print(f"\n[✓] Видалено: {game.title}")
                db.session.delete(game)
                removed_count += 1
            else:
                # Спроба з іншими варіантами
                game = FlashGame.query.filter(
                    FlashGame.title.ilike(f'%{game_name}%')
                ).first()
                if game:
                    print(f"\n[✓] Видалено: {game.title}")
                    db.session.delete(game)
                    removed_count += 1
        
        db.session.commit()
        
        if removed_count > 0:
            print(f"\n[OK] Видалено {removed_count} ігр(и)!")
        else:
            print("\n[INFO] Жодних ігор для видалення не знайдено")
        
        # Показати залишилися ігри
        remaining = FlashGame.query.all()
        print(f"\n[INFO] Залишилося {len(remaining)} ігр:")
        for game in remaining:
            print(f"  - {game.title}: {game.swf_url}")

if __name__ == '__main__':
    main()
