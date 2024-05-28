import db from "./db";
import getSession from "./session";

export default async function getUser() {
  const session = await getSession();
  if (session.idx) {
    const user = await db.user.findUnique({
      where: {
        idx: session.idx,
      },
    });
    if (user) {
      return user;
    } else {
      return null;
    }
  }
  return null;
}
