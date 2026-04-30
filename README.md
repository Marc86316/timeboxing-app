# TimeBoxing pOS (Personal OS)

一個專為高效能人士設計的 TimeBoxing 視覺化作業系統。透過 AI 驅動的任務解構與無摩擦的番茄鐘互動介面，幫助使用者將混亂的靈感轉化為精確的執行計畫。

## 核心特色

### 1. AI Brain Dump (大腦卸載)
* 結構化萃取：輸入一段雜亂的文字，AI 會自動辨識任務名稱、優先順序與預估時間。
* 阻力降維：AI 支援將複雜任務一鍵解構為多個微任務，降低開始工作的心理門檻。

### 2. 視覺化畫布 (Time-Blocking Canvas)
* 無縫拖放：直接將任務從待辦清單拖入時間軸。
* 動態網格：支援 5/10/15/30 分鐘多種網格間距切換。
* 當前線條：實時紅線追蹤，讓你一眼看出現在與計畫的落差。

### 3. 進階番茄鐘 (Advanced Pomodoro)
* 尺規調節：獨創的滾輪尺規調節時長，支援 120 分鐘長專注或無限正計時模式。
* 無摩擦啟動：將任務丟入番茄鐘即可立即開始，無需多餘點擊。
* 防呆中斷：長按取消機制，防止誤觸，並支援 5 分鐘內無痕取消。

### 4. 任務分層管理
* 優先順序：區分 Starred (優先) 與 Regular 任務。
* 父子階層：支援子任務結構，適合處理大型專案。

---

## 技術架構

本專案採用 MVVM 概念進行解耦，確保 UI 與邏輯的分離：

* Frontend Framework: React (Hooks)
* Styling: Tailwind CSS
* Build Tool: Vite
* Icons Library: Lucide React (用於 UI 介面)
* State Management: React Local State

---

## 資料夾結構說明

```text
timeboxing-app/
├── src/
│   ├── components/
│   │   ├── Pomodoro/    # 進階番茄鐘組件
│   │   ├── Task/        # 任務卡片與編輯器
│   │   └── Layout/      # 畫布與側邊欄布局
│   ├── hooks/           # 自定義 Hook (任務與拖放邏輯)
│   ├── utils/           # Helper functions 與常數設定
│   ├── App.jsx          # 總指揮中心
│   └── index.css        # 全域樣式與 Tailwind 配置
└── public/              # 靜態資源檔案
```

## 快速開始
1. 安裝依賴
```bash
npm install
```
3. 啟動開發伺服器
```bash
npm run dev
```
5. 建立生產版本
```bash
npm run build
```
## 未來開發路線 (Roadmap)

Cloud Sync: 整合 Firebase 實現跨裝置存取。

Analytics: 自動生成每週生產力分析報告。

Dark Mode: 支援深色模式以適應深夜專注需求。

Collaborative Mode: 支援分享專注畫布與團隊同步。
