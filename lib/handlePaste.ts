import { getUploadUrl } from "./upload";

export async function handlePaste(
  event: React.ClipboardEvent<HTMLTextAreaElement>,
  setIsUploadingImages: (isUploading: boolean) => void,
  content: string,
  setContent: (content: string) => void,
  contentRef: React.RefObject<HTMLTextAreaElement>
) {
  const clipboardData = event.clipboardData;
  const items = clipboardData?.items;
  const pastedText = clipboardData.getData("text");
  if (pastedText) return;
  if (items) {
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          setIsUploadingImages(true);
          const { success, result } = await getUploadUrl();
          if (!success) {
            setIsUploadingImages(false);
            return;
          }
          const { uploadURL } = result;
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(uploadURL, {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            setIsUploadingImages(false);
            return;
          }
          const responseData = await uploadResponse.json();
          const variants = responseData.result.variants;
          const fileUrl = variants.find((url: string) =>
            url.endsWith("/public")
          );
          const markdownImageTag = `![이미지 설명](${fileUrl})\n`;
          let currentSelectionStart = contentRef.current?.selectionStart;
          let currentSelectionEnd = contentRef.current?.selectionEnd;

          if (
            typeof currentSelectionStart !== "number" ||
            typeof currentSelectionEnd !== "number"
          ) {
            currentSelectionStart = content.length;
            currentSelectionEnd = content.length;
          }
          const beforeSelection = content.substring(0, currentSelectionStart);
          const afterSelection = content.substring(currentSelectionEnd);
          const newContent =
            beforeSelection + markdownImageTag + afterSelection;
          setContent(newContent);
          const newCursorPosition =
            currentSelectionStart + markdownImageTag.length;
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.selectionStart = newCursorPosition;
              contentRef.current.selectionEnd = newCursorPosition;
              contentRef.current.focus();
            }
          }, 0);
          setIsUploadingImages(false);
        }
      }
    }
  }
}
