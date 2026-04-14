"use server";

import db from "./db";
import { publicUserSelect } from "./selects";
import getSession from "./session";
import { isUserOperatorSession } from "./security";

export async function getUser() {
  const session = await getSession();
  if (!session.idx) {
    return null;
  }
  return db.user.findUnique({
    where: {
      idx: session.idx,
    },
    select: publicUserSelect,
  });
}

export async function isUserOperator() {
  return isUserOperatorSession();
}

export async function getIsOwner(userIdx: number) {
  const session = await getSession();
  if (!session.idx) {
    return false;
  }
  return session.idx === userIdx;
}
