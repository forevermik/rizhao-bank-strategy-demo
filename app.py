import base64
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


st.set_page_config(
    page_title='日照银行“十五五”战略规划执行管理平台',
    page_icon='🏦',
    layout='wide',
    initial_sidebar_state='collapsed',
)

st.markdown(
    """
    <style>
      header[data-testid="stHeader"], footer { display: none; }
      .stAppViewContainer, .main, .block-container { padding: 0 !important; margin: 0 !important; }
      .block-container { max-width: 100% !important; }
      iframe[title="streamlit.components.v1.html"] { display: block; border: 0; }
    </style>
    """,
    unsafe_allow_html=True,
)

static_dir = Path(__file__).parent / 'static'
index_file = static_dir / 'index.html'
assets_dir = static_dir / 'assets'

if not index_file.exists():
    st.error('前端资源尚未生成，请先运行 npm run build:streamlit。')
    st.stop()

index_html = index_file.read_text(encoding='utf-8')

# Streamlit Community Cloud serves an app through an outer proxy. Absolute
# /app/static references inside a component iframe resolve against that proxy.
# Inline the production bundle so the app works at its public Streamlit URL.
css_file = next(assets_dir.glob('index-*.css'))
js_file = next(assets_dir.glob('index-*.js'))
css = css_file.read_text(encoding='utf-8')
js = js_file.read_text(encoding='utf-8')

# React Router falls back to window.location.href when a document has a null
# origin. A Streamlit component runs at about:srcdoc, which is not a valid base
# URL for new URL. Give the history adapter a stable public base.
js = js.replace(
    'a.location.origin!=="null"?a.location.origin:a.location.href',
    'a.location.origin!=="null"?a.location.origin:"https://rizhao-bank-strategy-demo.streamlit.app/"',
)

for image_file in assets_dir.glob('*.png'):
    encoded = base64.b64encode(image_file.read_bytes()).decode('ascii')
    data_url = f'data:image/png;base64,{encoded}'
    public_path = f'/app/static/assets/{image_file.name}'
    index_html = index_html.replace(public_path, data_url)
    css = css.replace(public_path, data_url)
    js = js.replace(public_path, data_url)

safe_js = js.replace('</script>', '<\/script>')
index_html = index_html.replace(
    f'<script type="module" crossorigin src="/app/static/assets/{js_file.name}"></script>',
    f'<script type="module">{safe_js}</script>',
)
index_html = index_html.replace(
    f'<link rel="stylesheet" crossorigin href="/app/static/assets/{css_file.name}">',
    f'<style>{css}</style>',
)

components.html(index_html, height=1200, scrolling=True)
