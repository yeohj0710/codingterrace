interface CachedPosts {
  posts: any[];
  totalPages: number;
}

export const postCache: { [key: string]: CachedPosts } = {};

export const clearPostCache = (category: string) => {
  Object.keys(postCache).forEach((key) => {
    if (key.startsWith(category)) {
      delete postCache[key];
    }
  });
};
