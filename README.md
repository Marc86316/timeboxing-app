# TimeBoxing pOS (Personal OS)

[English](#english) | [繁體中文](#traditional-chinese)

---

<a name="english"></a>

A visualized TimeBoxing Operating System designed for high-performance individuals. Transform chaotic inspiration into precise execution plans through AI-driven task deconstruction and a frictionless Pomodoro interface.

### Core Features
* **AI Brain Dump**: Automatically identifies task names, priorities, and estimated durations from raw text input.
* **Time-Blocking Canvas**: Seamless drag-and-drop task scheduling with dynamic grids (5/10/15/30 min).
* **Advanced Pomodoro**: Unique ruler-style duration adjustment, supporting long focus sessions or infinite stopwatch mode.
* **Task Hierarchy**: Supports Starred tasks and sub-task structures for complex project management.

### Future Roadmap
* **Atmosphere & Focus**: Ambient soundscapes (YTP-style) and specialized Dark Mode for deep work.
* **Ecosystem**: Cloud sync and "System Showcase" for sharing personal workflow templates.
* **Mission Report**: "Mars Mission" style feedback loops to track internal/external distractions and productivity gaps.
* **Mobile Hardware Control**: 
    - **Gyroscope Focus**: "Flip to Focus" mode using hardware sensors to detect device movement.
    - **App Locking**: Deep integration with Screen Time APIs to block digital distractions during sessions.

---

<a name="traditional-chinese"></a>

一個專為高效能人士設計的 TimeBoxing 視覺化作業系統。透過 AI 驅動的任務解構與無摩擦的番茄鐘互動介面，幫助使用者將混亂的靈感轉化為精確的執行計畫。

### 核心特色
* **AI Brain Dump (大腦卸載)**：輸入雜亂文字，AI 自動辨識任務名稱、優先順序與預估時間。
* **視覺化畫布 (Time-Blocking Canvas)**：無縫拖放任務至時間軸，支援 5/10/15/30 分鐘動態網格切換。
* **進階番茄鐘 (Advanced Pomodoro)**：獨創滾輪尺規調節時長，支援 120 分鐘長專注或無限正計時模式。
* **任務分層管理**：區分 Starred (優先) 與 Regular 任務，支援子任務結構。

### 未來開發路線 (Roadmap)

#### 1. 視覺與沉浸體驗 (Atmosphere & Focus)
* **深色模式與主題**: 深度優化深夜專注介面，提供低對比度配色以減輕眼部負擔。
* **環境音場 (Ambient Soundscape)**：內建白噪音與環境音控制器（如：雨聲、太空艙低鳴），支援與任務節奏同步變換音場。

#### 2. 資料同步與生態粘滯性 (Ecosystem & Retention)
* **Cloud Sync**: 整合 Firebase 實現多端同步，讓桌面端規劃與行動端執行無縫接軌。
* **個人系統分享 (System Showcase)**：支援匯出個人 TimeBoxing 模板與工作流，透過分享建立社群連結感。
* **增強粘滯性**: 提供雲端儲存空間與進階數據分析報告，建立使用者長期依賴的生產力基石。

#### 3. 數據洞察與任務回報 (Analytics & Feedback)
* **任務回報機制 (Mission Report)**：
    - 參考「太空探索」電影的回報機制，在每個任務結束後引導使用者進行極簡的「狀態回傳」。
    - 紀錄中斷原因（外擾/內耗），並在週報中具體呈現阻礙因素，將計時轉化為「作戰紀錄」。

#### 4. 協作與社交動力 (Collaboration & Social)
* **共享畫布 (Collaborative Canvas)**：支援團隊成員查看彼此的專注時段（不顯示具體內容），實現非同步的共同專注感。

#### 5. 行動端硬體整合 (Mobile Edge & Control)
* **陀螺儀專注檢測 (Gyroscope Focus)**：
    - **翻轉專注模式**：啟動後手機需螢幕朝下，利用陀螺儀偵測移動，若手機被拿起則記錄為「專注偏移」。
* **螢幕時間與應用鎖 (Screen Time Integration)**：
    - **深度干擾阻斷**：專注時段內自動限制社交媒體存取。
    - **數據映射**：將手機使用時間與計畫畫布對比，視覺化數位分心對計畫造成的延誤。

---

## 技術架構 (Technical Stack)

* Frontend Framework: React (Hooks)
* Styling: Tailwind CSS
* Build Tool: Vite
* Icons Library: Lucide React
* State Management: React Local State

## 資料夾結構 (Directory Structure)

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

## 授權條款 (License)
MIT License.
