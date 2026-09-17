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

index_file = Path(__file__).parent / 'static' / 'index.html'
if not index_file.exists():
    st.error('前端资源尚未生成，请先运行 npm run build:streamlit。')
    st.stop()

components.html(index_file.read_text(encoding='utf-8'), height=1200, scrolling=True)
