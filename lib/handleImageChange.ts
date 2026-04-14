import { validateImageFile } from "@/lib/imageValidation";
import { getUploadUrl } from "@/lib/upload";

export async function handleImageChange(
  event: React.ChangeEvent<HTMLInputElement>,
  setIsUploadingImages: React.Dispatch<React.SetStateAction<boolean>>,
  content: string,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  contentRef: React.RefObject<HTMLTextAreaElement>
) {
  const { files } = event.target;

  if (!files || files.length === 0) {
    return;
  }

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    const validationError = validateImageFile(file);

    if (validationError) {
      alert(validationError);
      event.target.value = "";
      return;
    }
  }

  setIsUploadingImages(true);
  let currentSelectionStart = contentRef.current?.selectionStart || 0;
  let currentSelectionEnd = contentRef.current?.selectionEnd || 0;

  for (const file of fileArray) {
    const { success, result, error } = await getUploadUrl();

    if (!success) {
      console.error("Failed to get upload URL:", error);
      alert("Failed to get a secure image upload URL.");
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
    const fileUrl = variants.find((url: string) => url.endsWith("/public"));

    if (!fileUrl) {
      setIsUploadingImages(false);
      return;
    }

    const markdownImageTag = `![image](${fileUrl})\n`;
    const beforeSelection = content.substring(0, currentSelectionStart);
    const afterSelection = content.substring(currentSelectionEnd);
    const newContent = beforeSelection + markdownImageTag + afterSelection;
    setContent(newContent);
    currentSelectionStart = currentSelectionStart + markdownImageTag.length;
    currentSelectionEnd = currentSelectionStart;

    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.selectionStart = currentSelectionStart;
        contentRef.current.selectionEnd = currentSelectionEnd;
        contentRef.current.focus();
      }
    }, 0);
  }

  setIsUploadingImages(false);
  event.target.value = "";
}
