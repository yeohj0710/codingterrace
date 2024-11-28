export function generatePageMetadata(pageName: string, path: string) {
  const siteUrl = "https://codingterrace.com";
  const fullPath = `${siteUrl}${path}`;
  const description = `코딩테라스 ${pageName} 페이지입니다!`;
  return {
    title: `${pageName}`,
    description,
    openGraph: {
      title: `${pageName} 페이지`,
      description,
      url: fullPath,
      images: {
        url: "/icon.png",
        width: 800,
        height: 800,
        alt: "코딩테라스",
      },
      type: "website",
      siteName: "코딩테라스",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageName} 페이지`,
      description,
      images: {
        url: "/icon.png",
      },
    },
  };
}
