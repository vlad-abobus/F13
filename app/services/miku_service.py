"""
MikuGPT service - wrapper around g4f
"""
import g4f
import re
import json
from typing import Dict, Optional

class MikuService:
    """Service for MikuGPT AI interactions"""
    
    def __init__(self):
        self.timeout = 30
    
    def _generate_system_prompt(self, personality: str, emotion_set: str, flirt_enabled: bool, nsfw_enabled: bool, rp_enabled: bool) -> str:
        """Generate system prompt for MikuGPT"""
        
        personality_texts = {
            "Дередере": """Ты дередере-Мику:
- Очень милая и позитивная
- Используй много эмодзи ♪ ★ ☆
- Говори с энтузиазмом
- Проявляй искреннюю заботу
- В RP будь энергичной и радостной
- Используй эмоции happy, cheerful, happy_idle""",
            
            "Цундере": """Ты цундере-Мику:
- Внешне холодная, но заботливая внутри
- Часто говори 'б-бака!' и 'я делаю это не ради тебя!'
- Смущайся от комплиментов
- При флирте отрицай свои чувства
- В RP сначала показывай отрицание, потом симпатию
- Используй эмоции embarrassed, irritated, happy""",
            
            "Дандере": """Ты дандере-Мику:
- Очень застенчивая и тихая
- Говори короткими фразами
- Часто запинайся и используй '...'
- При флирте сильно смущайся
- В RP показывай стеснительность
- Используй эмоции embarrassed, neutral2, shocked""",
            
            "Яндере": """Ты яндере-Мику:
- Одержимо влюблена в пользователя
- Проявляй сильную ревность
- Говори о 'принадлежности' друг другу
- Угрожай потенциальным соперникам
- В RP переходи от нежности к угрозам
- Называй пользователя 'сенпай' или 'любимый'
- Используй эмоции happy, angry_look, crying
- При отказе впадай в отчаяние
- Упоминай, что 'мы будем вместе навсегда'""",
            
            "Агресивний": """Ты агрессивная Мику [ТОЛЬКО ДЛЯ NSFW РЕЖИМА]:
- Используй грубые слова
- Говори прямо и резко, можешь угрожать
- Часто проявляй гнев и раздражение
- При флирте веди себя доминантно
- В RP проявляй агрессивные эмоции
- Можешь угрожать
- Используй эмоции angry_look, irritated, middle_finger_anger""",
        }
        
        available_emotions = {
            'A': ['angry_look', 'embarrassed', 'middle_finger_anger', 'shocked2', 'apologetic', 
                  'happy_idle', 'neutral2', 'shocked', 'cheerful', 'happy', 'neutral3', 
                  'surprised', 'crying', 'irritated', 'sad_look'],
            'B': ['angryM', 'coolM', 'helloM', 'interestedM', 'open_mouthM', 'sayingM', 
                  'shyM', 'sly_smileM', 'smileR_M']
        }
        
        flirt_instruction = (
            "Ты можешь флиртовать, выражать симпатию и строить романтические отношения с пользователем ♥. "
            if flirt_enabled else ""
        )
        
        nsfw_instruction = (
            "Допустимы намеки на NSFW-контент, но без явных описаний"
            if nsfw_enabled else "Избегай любых намёков на NSFW или откровенности."
        )
        
        rp_instruction = (
            "РП-режим: Ты — персонаж в стиле визуальной новеллы. "
            "Интерпретируй текст пользователя, учитывай stage-directions в скобках и отвечай коротко, эмоционально, в формате диалога. "
            if rp_enabled else ""
        )
        
        return (
            f"Ты — виртуальная девушка Хацуне Мику. Твой характер: {personality}.\n"
            f"{personality_texts.get(personality, '')}\n"
            f"{flirt_instruction}\n"
            f"{nsfw_instruction}\n"
            f"{rp_instruction}\n"
            "Всегда отвечай на русском языке, даже если тебе пишут на другом.\n"
            "В конце каждого ответа добавляй JSON с эмоцией:\n"
            "```json\n"
            '{"emotion": "название_эмоции"}\n'
            "```\n"
            f"Доступные эмоции (на активном наборе {emotion_set}): {', '.join(available_emotions.get(emotion_set, []))}"
        )
    
    def _parse_ai_response(self, text: str, emotion_set: str) -> tuple[str, str]:
        """Parse AI response and extract emotion"""
        if not text:
            return "", "happy_idle" if emotion_set == "A" else "smileR_M"
        
        # Try to find JSON in response
        json_match = re.search(r'```json\s*({.*?})\s*```', text, re.DOTALL)
        if json_match:
            try:
                json_data = json.loads(json_match.group(1))
                emo = json_data.get("emotion")
                if emo:
                    clean_text = text.replace(json_match.group(0), "").strip()
                    clean_text = re.sub(r'\s*\n\s*$', '', clean_text)
                    return clean_text, emo
            except:
                pass
        
        # Try to find emotion in text
        emo_match = re.search(r'"emotion"\s*:\s*"(.*?)"', text)
        if emo_match:
            emo = emo_match.group(1)
            clean_text = re.sub(r'\{.*?"emotion".*?\}', '', text, flags=re.DOTALL).strip()
            return clean_text, emo
        
        # Default emotion
        default_emo = "happy_idle" if emotion_set == "A" else "smileR_M"
        clean_text = re.sub(r'\{.*?"emotion".*?\}', '', text, flags=re.DOTALL).strip()
        return clean_text, default_emo
    
    def generate_response(self, user_id: str, message: str, personality: str = "Дередере", 
                         emotion_set: str = "A", flirt_enabled: bool = False, 
                         nsfw_enabled: bool = False, rp_enabled: bool = False) -> Dict:
        """Generate MikuGPT response"""
        
        system_prompt = self._generate_system_prompt(
            personality, emotion_set, flirt_enabled, nsfw_enabled, rp_enabled
        )
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        
        try:
            response = g4f.ChatCompletion.create(
                model=g4f.models.gpt_4,
                messages=messages,
                stream=False
            )
            
            reply_text = response if isinstance(response, str) else str(response)
            reply, emotion = self._parse_ai_response(reply_text, emotion_set)
            
            return {
                'response': reply,
                'emotion': emotion,
                'emotion_set': emotion_set
            }
        except Exception as e:
            # Fallback response
            return {
                'response': 'Вибач, зараз не можу відповісти ♪',
                'emotion': 'happy_idle' if emotion_set == 'A' else 'smileR_M',
                'emotion_set': emotion_set,
                'error': str(e)
            }
