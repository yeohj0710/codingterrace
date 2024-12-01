import { defaultSchema, Schema } from "hast-util-sanitize";

export const customSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "p",
    "br",
    "strong",
    "em",
    "blockquote",
    "code",
    "pre",
    "hr",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "span",
    "font",
    "iframe",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": ["className", "style", "color"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "className"],
    iframe: [
      "src",
      "width",
      "height",
      "title",
      "allow",
      "allowfullscreen",
      "frameborder",
      "referrerpolicy",
    ],
  },
  clobberPrefix: "",
  allowComments: true,
};
