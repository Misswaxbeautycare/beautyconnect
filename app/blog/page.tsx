import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir sm:text-4xl">Blog</h1>
      <p className="mt-3 text-noir/60">
        Conseils pratiques pour gérer et développer votre salon de beauté.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {blogPosts
          .slice()
          .reverse()
          .map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-beige-dark p-5 transition hover:border-or"
            >
              <p className="text-xs text-noir/40">
                {new Date(post.publishedAt).toLocaleDateString("fr-BE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {post.readingMinutes} min de lecture
              </p>
              <h2 className="mt-2 font-display text-xl text-noir group-hover:text-or-dark">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-noir/60">{post.excerpt}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
