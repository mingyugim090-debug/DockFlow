from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import json
import uuid

TEMPLATES_DIR = Path(__file__).parent / "templates"
THEMES_DIR    = Path(__file__).parent / "themes"

env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

def load_theme(theme_name: str) -> dict:
    path = THEMES_DIR / f"{theme_name}.json"
    if not path.exists():
        path = THEMES_DIR / "modern_dark.json"
    return json.loads(path.read_text())

def render_slide(
    layout: str,
    slide_data: dict,
    theme_name: str = "modern_dark",
    slide_index: int = 1,
    total_slides: int = 1,
    deck_title: str = "",
) -> str:
    """슬라이드 하나를 완전 독립 HTML 문자열로 렌더링"""
    theme = load_theme(theme_name)
    template = env.get_template(f"{layout}.html")
    return template.render(
        theme=theme,
        slide_index=slide_index,
        total_slides=total_slides,
        deck_title=deck_title,
        **slide_data,
    )

def create_deck(deck_id: str, slides_dir: Path) -> Path:
    """덱 디렉토리 생성"""
    deck_path = slides_dir / deck_id
    deck_path.mkdir(parents=True, exist_ok=True)
    return deck_path

def save_slide(deck_path: Path, index: int, html: str) -> Path:
    """슬라이드 HTML 파일 저장"""
    slide_path = deck_path / f"slide-{index:02d}.html"
    slide_path.write_text(html, encoding="utf-8")
    return slide_path

def load_slide(deck_path: Path, index: int) -> str:
    slide_path = deck_path / f"slide-{index:02d}.html"
    return slide_path.read_text(encoding="utf-8")

def list_slides(deck_path: Path) -> list[Path]:
    return sorted(deck_path.glob("slide-*.html"))

def update_slide(deck_path: Path, index: int, html: str) -> None:
    slide_path = deck_path / f"slide-{index:02d}.html"
    slide_path.write_text(html, encoding="utf-8")
