from pathlib import Path
import re

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

if not index_file.exists():
    st.error('前端资源尚未生成，请先运行 npm run build:streamlit。')
    st.stop()

index_html = index_file.read_text(encoding='utf-8')

# The component runs in a srcdoc iframe. Point its production assets at the
# Streamlit app's internal static-file route instead of sending the whole
# JavaScript bundle through the component WebSocket on every page load.
public_asset_base = (
    'https://rizhao-bank-strategy-demo.streamlit.app/~/+/app/static/assets/'
)
index_html = index_html.replace('/app/static/assets/', public_asset_base)
index_html = index_html.replace('<script type="module" crossorigin', '<script defer')

# Streamlit serves project CSS as text/plain, which browsers reject as a
# stylesheet. Inline the generated CSS while keeping the larger JS bundle on
# the public static route.
stylesheet_match = re.search(r'<link rel="stylesheet" crossorigin href="[^"]*/([^/"]+\.css)">', index_html)
if stylesheet_match:
    stylesheet_file = static_dir / 'assets' / stylesheet_match.group(1)
    if stylesheet_file.exists():
        stylesheet = stylesheet_file.read_text(encoding='utf-8')
        index_html = index_html.replace(stylesheet_match.group(0), f'<style>{stylesheet}</style>')

components.html(index_html, height=1200, scrolling=True)
