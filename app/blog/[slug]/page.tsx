import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-noir/50 hover:text-noir">
        <ArrowLeft size={14} /> Retour au blog
      </Link>

      <p className="mt-6 text-xs text-noir/40">
        {new Date(post.publishedAt).toLocaleDateString("fr-BE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        {" · "}
        {post.readingMinutes} min de lecture
      </p>
      <h1 className="mt-2 font-display text-3xl text-noir sm:text-4xl">{post.title}</h1>

      <div className="mt-8 space-y-4 text-noir/70">
        {post.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-beige-dark p-6 text-center">
        <p className="font-display text-lg text-noir">Prête à développer votre salon ?</p>
        <Link
          href="/pro/inscription"
          className="mt-4 inline-block rounded-full bg-noir px-8 py-3 text-sm font-semibold text-white transition hover:bg-or hover:text-noir"
        >
          Créer mon espace pro
        </Link>
      </div>
    </div>
  );
}
