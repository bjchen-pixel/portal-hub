# 🌐 Web Projects Hub (網頁專案集中目錄)

此目錄專門收納、管理所有**網頁應用程式（Web Applications）**、**瀏覽器互動工具**與**線上教材專案**，作為個人數位入口網站（Portal Hub）與伺服器部署的統一部署倉庫。

---

## 📂 專案列表 (Current Projects)

### 1. 🧠 [phrasal-verbs-tool](./phrasal-verbs-tool/)
- **專案名稱**：PhrasalFlow - 英語高頻片語動詞互動學習神器 (v3.0)
- **類型**：純前端互動式 Web 應用 (Vanilla HTML5 / CSS3 / JavaScript)
- **核心功能**：
  - 三階階梯學習（300 組片語動詞）
  - 100% 雙真人發音覆蓋（600 首 MP3，微軟 Azure 神經語音 + Web Speech API 容錯）
  - 3D 沉浸式單字卡訓練（快捷鍵支援）
  - 三大題型智慧測驗中心（釋義配對、情境克漏字、聽力測驗）
  - 介系詞認知思維地圖（10 大空間隱喻）
- **啟動方式**：直接開啟 `index.html` 或透過 Web 伺服器掛載。

### 2. 🗣️ [英語日常口說 Chunk 訓練系統](./英語日常口說%20Chunk%20訓練系統/)
- **專案名稱**：Daily Spoken English Chunk Training System
- **類型**：口說語塊練功簿與結構化學習系統
- **核心檔案**：
  - `chunk-workbook.html`：互動式語塊練功網頁
  - `Chunk 口說練功簿.pdf`：排版練功手冊
  - 完整的 Phase 1 訓練排程與研發管線
- **啟動方式**：瀏覽器開啟 `chunk-workbook.html`。

### 3. ⚙️ [MED-advisor](./MED-advisor/)
- **專案名稱**：機械設計小幫手 (MED-advisor) — 螺絲孔設計建議工具
- **類型**：React 18 + TypeScript + Vite 現代化工程計算 Web 應用
- **線上展示**：[https://bjchen-pixel.github.io/MED-advisor/](https://bjchen-pixel.github.io/MED-advisor/)
- **核心功能**：
  - 螺絲規格（M3 ~ M12）、板厚、墊圈配合與材質設定
  - 咬合深度／剩餘牙深自動計算與即時幾何剖面圖渲染
  - 廠內牙深規範與孔位防呆驗證
- **啟動方式**：可開啟編譯後 `dist/index.html` 或透過 Vite `npm run dev` 啟動。

### 4. 📚 [nce-flow](./nce-flow/)
- **專案名稱**：NCE Flow - 新概念英語課本導航系統
- **類型**：純前端英語學習教材與課本導航（全套 1~4 冊）
- **核心功能**：
  - 完整收錄新概念英語 1~4 冊課文、單字與全課音訊
  - 沉浸式課文跟讀、音訊同步播放、學習歷史與進度追蹤
- **啟動方式**：瀏覽器開啟 `index.html`。

### 5. 🔒 [simple-file-transfer](./simple-file-transfer/)
- **專案名稱**：Simple File Transfer - 簡易檔案傳輸系統
- **類型**：Python 3.11 + Flask Web 後端檔案管理服務
- **核心功能**：
  - 多使用者權限管理、檔案上傳/下載、目錄瀏覽
  - 密碼登入驗證、安全防護與自動化部署腳本
- **啟動方式**：`python3 app.py` 或透過 systemd / Gunicorn 部署。

---

## 🚀 未來擴充與入口網站規劃 (Next Steps)
- [ ] 建立入口網站總導航儀表板（Portal Dashboard）。
- [ ] 整合伺服器 Docker / Nginx 反向代理，透過 `http://bjchentw.duckdns.org` 統一發布。
