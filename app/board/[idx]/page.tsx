export default function Post({ params: { idx } }: { params: { idx: string } }) {
  return <span>Post of {idx}!</span>;
}
