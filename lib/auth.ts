"use server";

import db from "./db";
import getSession from "./session";

export async function getUser() {
  const session = await getSession();
  if (!session.idx) {
    return null;
  }
  return db.user.findUnique({
    where: {
      idx: session.idx,
    },
  });
}

export async function isUserOperator() {
  const session = await getSession();
  if (!session?.idx) {
    return false;
  }
  const user = await db.user.findUnique({
    where: { idx: session.idx },
  });
  if (!user) {
    return false;
  }
  const operators = process.env.OPERATORS?.split(",") || [];
  return operators.includes(user.id);
}

export async function getIsOwner(userIdx: number) {
  const session = await getSession();
  if (!session.idx) {
    return false;
  }
  return session.idx === userIdx;
}
