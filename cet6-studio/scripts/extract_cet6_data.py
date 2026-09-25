#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_cet6_data.py
Extracts and structures all CET-6 learning assets into standard JSON files:
- data/cet6_phrases.json (663 high-frequency phrases)
- data/cet6_translations.json (49 classic translation long/complex sentences)
- data/cet6_collocations.json (116 key translation collocations)
- data/cet6_writing.json (Universal reasons, logic connectors, power sentences, quote templates)
"""

import json
import os
import re
import subprocess

BASE_DIR = "/Volumes/Data 4T/Projects/02-WebServices/英語學習素材/英语六级"
OUTPUT_DIR = "/Volumes/Data 4T/Projects/02-WebServices/web-projects/cet6-studio/data"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def doc_to_text(path):
    res = subprocess.run(["textutil", "-convert", "txt", path, "-stdout"], capture_output=True, text=True)
    return res.stdout


def extract_phrases():
    path = os.path.join(BASE_DIR, "词汇精讲/六级英语高频词组.doc")
    text = doc_to_text(path)

    # Normalize
    text = re.sub(r'(\d+)．', r'\1. ', text)
    text = re.sub(r'(\d+)\.([^\s\d])', r'\1. \2', text)
    text = re.sub(r'([^\n\d])(\d{1,3}\.\s*)', r'\1\n\2', text)

    phrases = []
    blocks = re.split(r'\n(?=\d+\.\s*)', text)
    for block in blocks:
        block = block.strip()
        m = re.match(r'^(\d+)\.\s*(.*)', block, re.DOTALL)
        if not m:
            continue
        pid = int(m.group(1))
        content = m.group(2).strip()

        # Extract synonyms like (=...) or (=...; ...)
        syn_match = re.search(r'\(=([^)]+)\)', content)
        synonyms = syn_match.group(1).strip() if syn_match else ""

        # Extract main phrase before (= or Chinese
        # Split on (= or first Chinese character
        first_cn = re.search(r'[\u4e00-\u9fa5]', content)
        if first_cn:
            cn_idx = first_cn.start()
            eng_part = content[:cn_idx].strip()
            cn_part = content[cn_idx:].strip()
        else:
            eng_part = content
            cn_part = ""

        # Clean english phrase
        eng_phrase = re.sub(r'\(=[^)]+\)', '', eng_part).strip()
        eng_phrase = re.sub(r'\s+', ' ', eng_phrase).strip(' .;:')

        # First letter for A-Z index
        first_letter = ""
        for ch in eng_phrase:
            if ch.isalpha():
                first_letter = ch.upper()
                break
        if not first_letter:
            first_letter = "#"

        # Determine tag / category
        tag = "核心短語"
        if "倒装" in content or "倒裝" in content:
            tag = "語法倒裝"
        elif "被动语态" in content:
            tag = "被動語態"
        elif "近:" in content or synonyms:
            tag = "同義替換"
        elif "不可数名词" in content or "名词" in content:
            tag = "名詞慣用"

        phrases.append({
            "id": pid,
            "phrase": eng_phrase,
            "raw": content,
            "synonyms": synonyms,
            "meaning": cn_part,
            "first_letter": first_letter,
            "tag": tag
        })

    phrases.sort(key=lambda x: x["id"])
    out_path = os.path.join(OUTPUT_DIR, "cet6_phrases.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(phrases, f, ensure_ascii=False, indent=2)
    print(f"Extracted {len(phrases)} phrases to {out_path}")


def extract_translations():
    path = os.path.join(BASE_DIR, "翻译进阶/大学英语六级最常考的翻译句子总结.doc")
    text = doc_to_text(path)

    raw_items = [it.strip() for it in text.split("Ø") if it.strip()]
    # Skip header
    sentences_raw = [it for it in raw_items if not it.startswith("翻译练习")]

    translations = []
    # Map grammar categories
    grammar_rules = [
        ("hardly had", "倒裝句 (Hardly...when)", "倒裝句"),
        ("no sooner had", "倒裝句 (No sooner...than)", "倒裝句"),
        ("surrounded by", "過去分詞作狀語", "分詞狀語"),
        ("thrilled at the news of his son's having been admitted", "動名詞複合結構 + 被動語態", "動名詞"),
        ("couldn't help yawning", "固定搭配 (can't help doing)", "固定搭配"),
        ("if you could be kind enough to", "禮貌客氣虛擬條件句", "虛擬語氣"),
        ("Unless you sign", "條件狀語從句 (not entitled to)", "條件句"),
        ("It is reported that", "形式主語 (It is reported that...)", "主從複合句"),
        ("lest the noise outside", "lest 引導虛擬語氣 (should do)", "虛擬語氣"),
        ("charged with failure to", "固定搭配 (be charged with)", "固定搭配"),
        ("When confronted with", "過去分詞省略主語時間狀語", "分詞狀語"),
        ("What upset me was not", "主語從句 + not...but結構", "主語從句"),
        ("more like a news report than", "比較結構 (more...than与其说是...不如说是)", "比較結構"),
        ("deprive him of", "固定動詞搭配 (deprive sb of sth)", "固定搭配"),
        ("while animal behavior depends mostly on", "並列對比從句 (while然而)", "對比句"),
        ("enables more women to take full advantages", "固定句式 (enable sb to do)", "動詞句型"),
        ("needs considering carefully before action are token", "主動表被動 (need doing)", "被動語態"),
        ("named one of the buildings after him", "固定搭配 (name after以...命名)", "固定搭配"),
        ("being considering insufficiently popular", "分詞短語作原因狀語", "分詞狀語"),
        ("eat twice more protein than", "倍數表達法 (twice more...than)", "倍數句型"),
        ("make yourself understood", "使役動詞複合賓語 (make oneself done)", "使役動詞"),
        ("adapt herself to", "反身代詞搭配 (adapt oneself to)", "固定搭配"),
        ("think it necessary that", "形式賓語 (think it adj that...)", "形式賓語"),
        ("Depending on what you are looking form", "分詞短語引導條件狀語", "分詞狀語"),
        ("had they been done by hand", "虛擬條件句倒裝 (if省略倒裝)", "虛擬語氣"),
        ("It was imperative that", "虛擬語氣 (imperative that should do)", "虛擬語氣"),
        ("No matter how frequently performed", "讓步狀語從句省略結構", "讓步句"),
        ("To minimize the possibility", "不定式作目的狀語", "不定式"),
        ("wise of you to show off", "評價句型 (It is adj of sb to do)", "句式搭配"),
        ("With repeated hacker’s attack", "with複合結構", "獨立主格"),
        ("room for improvement", "名詞搭配 (room for sth 改善空間)", "固定搭配"),
        ("makes it possible for plants to grow", "形式賓語 (make it possible for sb to do)", "形式賓語"),
        ("talked his daughter into", "說服搭配 (talk sb into doing)", "固定搭配"),
        ("out of proportion to", "比例搭配 (out of proportion to與...不成比例)", "固定搭配"),
    ]

    for idx, item in enumerate(sentences_raw, 1):
        # Fix OCR typos
        item_clean = item.replace("入取", "錄取")
        item_clean = item_clean.replace("二十他说话的方式", "而是他说话的方式")
        item_clean = item_clean.replace("before action are token", "before action is taken")
        item_clean = item_clean.replace("looking form", "looking for")
        item_clean = item_clean.replace("my won date", "my own date")
        item_clean = item_clean.replace("incontinences", "inconveniences")
        item_clean = item_clean.replace("talked his daughter", "talk his daughter")
        item_clean = item_clean.replace("more stricter", "stricter")

        # Extract target prompt (usually in parentheses or at end)
        m_paren = re.search(r'\(([^)]+)\)', item_clean)
        target_prompt = ""
        english_sentence = item_clean
        if m_paren:
            target_prompt = m_paren.group(1).strip()
            english_sentence = item_clean.replace(f"({target_prompt})", "").strip()
        else:
            # Check for trailing chinese
            m_cn = re.search(r'([\u4e00-\u9fa5，。]+)$', item_clean)
            if m_cn:
                target_prompt = m_cn.group(1).strip()
                english_sentence = item_clean[:m_cn.start()].strip()

        # Clean trailing/leading artifacts
        english_sentence = re.sub(r'\s+', ' ', english_sentence).strip(' .') + '.'

        # Match grammar rule
        cat = "重點句型"
        rule_desc = "核心語法長難句"
        for pattern, desc, c in grammar_rules:
            if pattern.lower() in english_sentence.lower():
                cat = c
                rule_desc = desc
                break

        translations.append({
            "id": idx,
            "english": english_sentence,
            "chinese_prompt": target_prompt,
            "grammar_tag": cat,
            "grammar_desc": rule_desc
        })

    out_path = os.path.join(OUTPUT_DIR, "cet6_translations.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)
    print(f"Extracted {len(translations)} translations to {out_path}")


def extract_collocations():
    path = os.path.join(BASE_DIR, "翻译进阶/新英语六级翻译题常用搭配116条.doc")
    text = doc_to_text(path)

    items = re.findall(r'(?:^|\n)\s*(\d+)\.\s*([^\n]+)', text)
    collocations = []
    for num, line in items:
        cid = int(num)
        line = line.strip()

        # Split English and Chinese if available
        first_cn = re.search(r'[\u4e00-\u9fa5]', line)
        if first_cn:
            eng = line[:first_cn.start()].strip()
            cn = line[first_cn.start():].strip()
        else:
            eng = line
            cn = ""

        # Determine tag
        tag = "動詞片語"
        if "to doing" in eng or "in doing" in eng or "doing" in eng:
            tag = "動名詞慣用"
        elif "to" in eng and ("superior" in eng or "inferior" in eng or "prior" in eng or "senior" in eng or "junior" in eng):
            tag = "比較級介系詞"
        elif "that" in eng or "虚拟" in cn:
            tag = "從句與虛擬"

        collocations.append({
            "id": cid,
            "phrase": eng,
            "meaning": cn,
            "tag": tag
        })

    collocations.sort(key=lambda x: x["id"])
    out_path = os.path.join(OUTPUT_DIR, "cet6_collocations.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(collocations, f, ensure_ascii=False, indent=2)
    print(f"Extracted {len(collocations)} collocations to {out_path}")


def extract_writing_assets():
    # 1. Ten Universal Reasons (Omnipotence)
    universal_reasons = [
        {
            "id": 1,
            "topic": "便利性與生活節奏",
            "en_topic": "Convenience & Accessibility",
            "keywords": ["convenient", "convenience", "facilitate", "accessible", "user-friendly"],
            "sentences": [
                "It brings unprecedented convenience to our daily study and work.",
                "With the rapid advancement of modern technology, tasks that once took days can now be accomplished at the click of a button."
            ]
        },
        {
            "id": 2,
            "topic": "工作與學習效率",
            "en_topic": "Efficiency & Productivity",
            "keywords": ["efficient", "efficiently", "efficiency", "productivity", "time-saving"],
            "sentences": [
                "It significantly boosts working efficiency and eliminates redundant procedures.",
                "Adopting this approach enables people to achieve maximum outcomes with minimum expenditure of time and energy."
            ]
        },
        {
            "id": 3,
            "topic": "節約資源與成本控制",
            "en_topic": "Thrift vs. Waste",
            "keywords": ["economical", "cost-effective", "thrift", "conserve", "wasteful", "costly"],
            "sentences": [
                "It serves as an economical solution that saves valuable financial resources and physical space.",
                "Failing to regulate this behavior inevitably results in a colossal waste of public money and natural reserves."
            ]
        },
        {
            "id": 4,
            "topic": "心理健康與意志品格",
            "en_topic": "Mental Health & Psychological Traits",
            "keywords": ["independent", "cooperative", "perseverance", "resilient", "isolated", "stress-relief"],
            "sentences": [
                "It cultivates an independent mindset, builds resilience, and encourages cooperative spirit.",
                "Facing high-pressure environments, individuals need effective outlets to alleviate anxiety and maintain emotional well-being."
            ]
        },
        {
            "id": 5,
            "topic": "身體健康與生命活力",
            "en_topic": "Physical Health & Vitality",
            "keywords": ["energetic", "vigorous", "disease-prevention", "sedentary lifestyle", "sound physique"],
            "sentences": [
                "A balanced routine is the bedrock of a sound physique and sustained intellectual output.",
                "Sedentary habits and excessive screen time exert a severe toll on the physical wellness of younger generations."
            ]
        },
        {
            "id": 6,
            "topic": "娛樂休閒與生活樂趣",
            "en_topic": "Recreation & Quality of Life",
            "keywords": ["enriching", "recreation", "pleasure", "relaxation", "work-life balance"],
            "sentences": [
                "Engaging in recreational activities enriches one's spiritual life and broadens mental horizons.",
                "It offers a welcome respite from hectic work schedules, allowing individuals to recharge their creative energy."
            ]
        },
        {
            "id": 7,
            "topic": "生態環保與可持續發展",
            "en_topic": "Environment & Sustainability",
            "keywords": ["eco-friendly", "sustainable", "carbon footprint", "biodiversity", "pollutants"],
            "sentences": [
                "Sustainable development demands that economic growth does not compromise our fragile ecological balance.",
                "Every individual has an inescapable responsibility to reduce their carbon footprint and protect natural habitats."
            ]
        },
        {
            "id": 8,
            "topic": "公共安全與風險防範",
            "en_topic": "Safety & Risk Prevention",
            "keywords": ["safety precautions", "hazard", "vulnerability", "risk mitigation", "secure"],
            "sentences": [
                "Strict safety measures must be instituted to preempt potential hazards before they escalate into catastrophes.",
                "Security consciousness ought to be embedded into every facet of organizational operations."
            ]
        },
        {
            "id": 9,
            "topic": "社會經驗與實踐積累",
            "en_topic": "Social Experience & Competence",
            "keywords": ["hands-on experience", "integrate into society", "practical insights", "adaptability"],
            "sentences": [
                "Theoretical knowledge acquired in classrooms remains hollow until tempered by firsthand social practice.",
                "Participating in community service bridges the gap between campus life and the demands of modern industry."
            ]
        },
        {
            "id": 10,
            "topic": "人際溝通與團隊合作",
            "en_topic": "Interpersonal Harmony & Teamwork",
            "keywords": ["harmonious", "empathy", "mutual understanding", "collaborative synergy"],
            "sentences": [
                "Open dialogue fosters empathy and dissolves misunderstandings among people of diverse cultural backgrounds.",
                "No milestone can be accomplished in solitude; collaborative synergy is the ultimate driving force of success."
            ]
        }
    ]

    # 2. Logic Connectors
    logic_connectors = [
        {
            "category": "轉折與讓步 (Concession & Contrast)",
            "items": [
                {"word": "Although", "usage": "引導讓步狀語從句，習慣置於句首，語氣正式，不能與 but 連用。"},
                {"word": "Though", "usage": "較口語，可放句首、句中或句尾（副詞用法），如 'He promised to come; he didn't, though.'"},
                {"word": "Despite / In spite of", "usage": "介系詞！後接名詞、代詞或動名詞 (doing)，絕不可直接接完整句子。"},
                {"word": "While", "usage": "置於句首作讓步（'While I understand your point...'），或置於句中作並列對比（'A does X, while B does Y'）。"},
                {"word": "as (倒裝)", "usage": "形容詞/副詞/動詞/單數名詞提前倒裝，如 'Rich as he is, he is not happy.' 或 'Child as she was...'"}
            ]
        },
        {
            "category": "因果推導 (Cause & Effect)",
            "items": [
                {"word": "Because", "usage": "語氣最強的直接原因，從句是資訊重心，回答 why 的提問。"},
                {"word": "Since / As", "usage": "表達雙方皆知的既定事實或附帶原因，主句才是表達重心。"},
                {"word": "For", "usage": "等立連詞，用於對前句進行補充說明或推斷性解釋，不可置於句首。"},
                {"word": "Therefore / Hence", "usage": "副詞！引出嚴謹推論的必然結果，Hence 更強調前述前提之重要性。"},
                {"word": "Consequently / Accordingly", "usage": "Consequently 強調事件隨後產生的連鎖結果；Accordingly 強調順理成章、依通例行事。"}
            ]
        },
        {
            "category": "遞進與強調 (Addition & Emphasis)",
            "items": [
                {"word": "Furthermore / Moreover", "usage": "正式書面語，用於在論據後追加更有說服力的新論據。"},
                {"word": "Particularly / Especially", "usage": "特指強調。Particularly 常用於特定個例，Especially 用於突出重要程度。"},
                {"word": "In addition to", "usage": "介系詞短語，後接名詞或動名詞，相當於 besides。"}
            ]
        }
    ]

    # 3. High-Scoring Power Sentences
    power_sentences = {
        "openings": [
            "Nowadays, it is commonly believed that..., but whether... remains a matter of lively controversy.",
            "Like a coin has two sides, there is an undeniable positive aspect and a negative counterpart to...",
            "Recently, the burgeoning phenomenon of... has been brought to the forefront of public attention.",
            "Along with the accelerating pace of modern globalization, ... has become increasingly pivotal in our daily existence."
        ],
        "closings": [
            "From what has been comprehensively discussed above, we may reasonably arrive at the conclusion that...",
            "Taking all relevant variables into account, we have reached the acute realization that...",
            "All in all, concerted efforts should be mounted by both governments and individuals to ensure that...",
            "Only by striking a delicate equilibrium between ... and ... can we usher in a brighter and more sustainable future."
        ]
    }

    # 4. Quote Essay Templates
    quote_templates = [
        {
            "id": 1,
            "theme": "創新精神 (The Importance of Innovation)",
            "quote": "Mindless habitual behavior is the enemy of innovation.",
            "author": "Rosabeth Moss Kanter",
            "model_essay": "“Mindless habitual behavior is the enemy of innovation.” I assume that you are familiar with Rosabeth Moss Kanter’s famous remark. It is obvious that a person who always clings obstinately to conventional habits can hardly pioneer new horizons.\n\nKanter’s profound remark aims at awakening us to the supreme significance of innovation. Why does creative thinking play an indispensable role in contemporary society? Primarily, innovation fuels the progress of both individual careers and civilizations as a whole. Only those equipped with originality can maintain an invincible competitive edge. A compelling illustration is Steve Jobs: without revolutionary vision, how could he have continually launched epoch-making products that radically transformed global communication?\n\nWe must constantly bear in mind that creative consciousness is the bedrock of breakthrough. Hence, we should cultivate the habit of questioning orthodoxies, embracing novel perspectives, and exploring uncharted territories in our daily undertakings.",
            "translation": "「盲目的習慣性行為是創新的死敵。」正如坎特名言所揭示，墨守成規之人斷難開闢新境。這句話旨在喚醒我們對創新思維的重視——創新是個人與社會進步的原動力，唯有創新者方能在競爭中立於不敗之地。賈伯斯若無顛覆性思維，便不可能推出改變全球通訊的劃時代產品。我們應當打破成規，勇於擁抱新思想。"
        },
        {
            "id": 2,
            "theme": "謙遜美德 (It Pays to be Modest)",
            "quote": "Modesty is not only an ornament, but also a guard to virtue.",
            "author": "Joseph Addison",
            "model_essay": "“Modesty is not only an ornament, but also a guard to virtue,” Joseph Addison once astutely observed. Modesty not only adorns an individual with elegance and grace, but also acts as an impenetrable shield preserving fine moral integrity.\n\nSimple as Addison’s dictum may appear, it encapsulates timeless philosophical wisdom. Why does modesty play such a crucial role throughout one’s life journey? Above all, modesty inspires individuals to pursue higher peaks without falling prey to complacency. Those genuinely modest never rest on their laurels; instead, they remain perpetually thirsty for knowledge. Consider Benjamin Franklin: had he been satisfied with his humble origins as a printer apprentice, he could never have achieved legendary triumphs across science, diplomacy, and literature.\n\nWe should firmly anchor this virtue in our hearts. At no juncture should we succumb to arrogance; rather, we must keep an open mind to absorb fresh insights and seize new opportunities with quiet determination.",
            "translation": "「謙虛不僅是美德的裝飾品，更是美德的護衛者。」艾迪生這句警句深刻指明，謙虛能讓人保持清醒，避免自滿停滯。真正的謙遜者永不固步自封，富蘭克林若滿足於印刷學徒的小成，斷不可能在科學、外交、文學多領域成就非凡。在任何人生階段，我們皆當戒驕戒躁，虛懷若谷。"
        }
    ]

    writing_data = {
        "universal_reasons": universal_reasons,
        "logic_connectors": logic_connectors,
        "power_sentences": power_sentences,
        "quote_templates": quote_templates
    }

    out_path = os.path.join(OUTPUT_DIR, "cet6_writing.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(writing_data, f, ensure_ascii=False, indent=2)
    print(f"Extracted writing assets to {out_path}")


if __name__ == "__main__":
    print("Starting CET-6 data extraction pipeline...")
    extract_phrases()
    extract_translations()
    extract_collocations()
    extract_writing_assets()
    print("All CET-6 data successfully generated!")
