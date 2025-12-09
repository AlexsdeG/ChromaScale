# 🎨 ChromaScale

**ChromaScale** is an color system builder designed for modern UI/UX workflows. Create in the **OKLCH** color space easy color scales from 50 to 950. All AI features is fully optional.

![App Screenshot](https://github.com/AlexsdeG/ChromaScale/blob/main/ChromaScale.png)

## ✨ Features

### 📐 Precision Color Math
*   **OKLCH Interpolation:** Generates smooth, perceptually uniform scales (50-950) that look natural to the human eye.
*   **Smart Snapping:** Input a color, and the engine calculates its luminance to lock it to the correct step (e.g., 500 or 900) before generating the rest of the scale.
*   **Accessible by Default:** Automatic contrast calculation for text overlays.
*   
### 🧠 (Optional) AI-Powered Intelligence
*   **Text-to-Palette:** Describe a mood ("cyberpunk neon city"), scene, or theme, and Gemini generates a structured 5-color palette.
*   **Smart Variants:** Ask AI to generate "Dark Mode" or "High Contrast" versions of your colors. It understands nuance (e.g., shifting hue towards blue for dark mode backgrounds).
*   **Image Extraction:** Drag and drop any image to extract dominant and accent colors using Gemini Vision.

### 🛠️ Developer Workflow
*   **Stack Management:** Create multiple independent color rows.
*   **Export Ready:** One-click export to **Tailwind CSS config** or **CSS Variables**.
*   **Undo System:** Accidentally deleted a scale? Restore it instantly with the undo toast.
*   **Clean UI:** Built with a "Zinc" aesthetic, focusing on usability and minimalism.

## 🚀 Tech Stack

*   **Framework:** React 18+ (Vite)
*   **Language:** TypeScript (Strict)
*   **Styling:** Tailwind CSS
*   **AI:** Google Gemini API (`@google/genai`)
    *   `gemini-2.5-flash`: Fast text & JSON generation.
    *   `gemini-3-pro-preview`: Advanced image analysis.
*   **Color Math:** `culori` (OKLCH handling).
*   **Icons:** Lucide React.

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/chromascale.git
    cd chromascale
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure API Key**
    (Optional) Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    *Note: Ensure your build tool injects this as `process.env.API_KEY` or update the initialization in `services/geminiService.ts` to matches your environment variable setup.*

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```text
src/
├── components/       # UI Components
│   ├── ChromaTool.tsx      # Main App Logic
│   ├── ColorRow.tsx        # Individual Scale Row
│   ├── ColorSwatch.tsx     # Single Color Block
│   ├── ExportModal.tsx     # Code Export UI
│   └── RandomColorPanel.tsx   # Random Color Generation
├── services/
│   └── geminiService.ts  # AI Integration (Text & Vision)
├── utils/
│   └── colorEngine.ts    # OKLCH Math & Scale Generation
└── types.ts          # TypeScript Definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
