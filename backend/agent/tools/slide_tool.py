SLIDE_PLAN_TOOL = {
    "name": "plan_slides",
    "description": (
        "프레젠테이션 전체 구조를 설계합니다. "
        "각 슬라이드의 레이아웃, 제목, 핵심 내용을 결정합니다. "
        "공모전 지원서, 사업계획서, 시장 분석 보고서에 적합합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "deck_title": {"type": "string", "description": "전체 프레젠테이션 제목"},
            "theme": {
                "type": "string",
                "enum": ["modern_dark", "executive", "minimal", "government"],
                "description": "디자인 테마. 정부 제안서는 government, 기업 발표는 executive"
            },
            "slides": {
                "type": "array",
                "description": "슬라이드 목록",
                "items": {
                    "type": "object",
                    "properties": {
                        "index":  {"type": "integer"},
                        "layout": {
                            "type": "string",
                            "enum": ["cover", "content", "two_col", "quote", "chart"],
                            "description": "cover=표지, content=불릿, two_col=2단, quote=인용구, chart=차트"
                        },
                        "title":    {"type": "string"},
                        "subtitle": {"type": "string", "description": "cover 레이아웃에서 사용"},
                        "eyebrow":  {"type": "string", "description": "슬라이드 상단 소제목"},
                        "bullets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "text": {"type": "string"},
                                    "sub":  {"type": "string", "description": "보조 설명 (선택)"}
                                }
                            }
                        },
                        "left":  {"type": "object", "description": "two_col 왼쪽"},
                        "right": {"type": "object", "description": "two_col 오른쪽"},
                        "notes": {"type": "string", "description": "발표자 노트"}
                    },
                    "required": ["index", "layout", "title"]
                }
            }
        },
        "required": ["deck_title", "theme", "slides"]
    }
}

SLIDE_REWRITE_TOOL = {
    "name": "rewrite_slide_element",
    "description": (
        "슬라이드 HTML에서 특정 요소를 수정합니다. "
        "사용자가 클릭한 요소의 HTML을 받아 새 버전으로 재작성합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "original_html":  {"type": "string", "description": "수정 전 요소 HTML"},
            "instruction":    {"type": "string", "description": "수정 지시사항"},
            "context_html":   {"type": "string", "description": "슬라이드 전체 HTML (맥락 파악용)"},
            "theme_name":     {"type": "string", "description": "현재 테마명"}
        },
        "required": ["original_html", "instruction"]
    }
}
