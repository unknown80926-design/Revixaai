export async function extractTextFromPDF(file: File): Promise<{ text: string; pages: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Load pdf.js from CDN
        if (!(window as any).pdfjsLib) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const pdf = await (window as any).pdfjsLib.getDocument({ data: e.target?.result }).promise;
        let text = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        resolve({ text: text.trim(), pages: pdf.numPages });
      } catch {
        // Fallback: treat as text file
        resolve({ text: e.target?.result?.toString?.() || "Unable to extract text.", pages: 1 });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
