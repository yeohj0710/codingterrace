import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();
const BCRYPT_PREFIX = /^\$2[aby]\$/;
const HASH_ROUNDS = 12;

async function migrateGuestPasswords() {
  const posts = await db.post.findMany({
    where: {
      password: {
        not: null,
      },
      userIdx: null,
    },
    select: {
      idx: true,
      password: true,
    },
  });

  const comments = await db.comment.findMany({
    where: {
      password: {
        not: null,
      },
      userIdx: null,
    },
    select: {
      idx: true,
      password: true,
    },
  });

  let migratedPosts = 0;
  let migratedComments = 0;

  for (const post of posts) {
    if (!post.password || BCRYPT_PREFIX.test(post.password)) {
      continue;
    }

    await db.post.update({
      where: { idx: post.idx },
      data: {
        password: await bcrypt.hash(post.password, HASH_ROUNDS),
      },
    });
    migratedPosts += 1;
  }

  for (const comment of comments) {
    if (!comment.password || BCRYPT_PREFIX.test(comment.password)) {
      continue;
    }

    await db.comment.update({
      where: { idx: comment.idx },
      data: {
        password: await bcrypt.hash(comment.password, HASH_ROUNDS),
      },
    });
    migratedComments += 1;
  }

  console.log(
    `Migrated ${migratedPosts} guest posts and ${migratedComments} guest comments.`
  );
}

migrateGuestPasswords()
  .catch((error) => {
    console.error("Failed to migrate guest passwords:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
