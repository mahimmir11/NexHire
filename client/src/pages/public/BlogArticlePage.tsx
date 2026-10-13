import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { BLOG_POSTS } from '../../data/blogData';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

export const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <BookOpen className="w-12 h-12 text-[#2E9D74] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#143026] mb-2">Article Not Found</h1>
          <p className="text-sm text-[#527566] mb-6">
            The career article you are looking for does not exist or may have been relocated.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E9D74] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Articles</span>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  // Related articles (other articles in same or different categories)
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <PublicLayout>
      <article className="py-8 sm:py-16 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none -z-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A7D6C0]/25 rounded-full blur-3xl"></div>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#61B795]/15 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[#527566] mb-8 font-medium">
            <Link to="/" className="hover:text-[#2E9D74]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/blog" className="hover:text-[#2E9D74]">
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#143026] font-semibold truncate max-w-[200px] sm:max-w-xs">
              {post.title}
            </span>
          </nav>

          {/* Article Header Card */}
          <header className="space-y-6 pb-8 border-b border-[#A7D6C0]/50">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/60">
                {post.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#527566] font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#2E9D74]" />
                <span>{post.readTime}</span>
              </div>
              <span className="text-[#A7D6C0]">&bull;</span>
              <div className="flex items-center gap-1.5 text-xs text-[#527566] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#2E9D74]" />
                <span>{post.date}</span>
              </div>
            </div>

            {/* Article Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#143026] tracking-tight leading-[1.15]">
              {post.title}
            </h1>

            {/* Excerpt / Lead */}
            <p className="text-lg sm:text-xl text-[#466a5b] leading-relaxed font-normal">
              {post.excerpt}
            </p>

            {/* Author Byline */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center font-extrabold text-white text-sm shadow-sm ring-2 ring-white">
                  {post.author.avatarInitials}
                </div>
                <div>
                  <span className="text-sm font-bold text-[#143026] block">
                    {post.author.name}
                  </span>
                  <span className="text-xs text-[#527566]">
                    {post.author.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/blog"
                  className="px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#143026] hover:bg-[#EAF6F0] transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Articles</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Visual Hero Banner */}
          <div className="my-8 rounded-3xl overflow-hidden shadow-nexhire-sm border border-[#A7D6C0]/60">
            <div className={`p-8 sm:p-12 bg-gradient-to-r ${post.coverGradient} text-white flex flex-col justify-between min-h-[180px] sm:min-h-[220px]`}>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white">
                  NexHire Career Series
                </span>
                <Sparkles className="w-5 h-5 text-white/80" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">
                  Publication Focus
                </span>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {post.category}
                </p>
              </div>
            </div>
          </div>

          {/* Key Takeaways Callout Box */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="my-10 p-6 sm:p-8 rounded-3xl bg-white border border-[#A7D6C0]/80 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#2E9D74]/15 flex items-center justify-center text-[#2E9D74]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#143026]">
                  Executive Summary &amp; Key Takeaways
                </h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[#1e4435]">
                {post.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Article Typography Body */}
          <div className="prose prose-slate max-w-none space-y-8 text-base text-[#254639] leading-relaxed">
            {/* Introduction */}
            <p className="text-base sm:text-lg text-[#1e4435] leading-relaxed font-normal bg-[#EAF6F0]/60 p-6 rounded-2xl border-l-4 border-[#2E9D74]">
              {post.content.intro}
            </p>

            {/* Content Sections */}
            {post.content.sections.map((section, idx) => (
              <section key={idx} className="space-y-4 pt-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#143026] tracking-tight">
                  {section.heading}
                </h2>

                {section.body.map((pText, pIdx) => (
                  <p key={pIdx} className="text-base text-[#385e4f] leading-relaxed">
                    {pText}
                  </p>
                ))}

                {section.tip && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 my-4">
                    <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-amber-950 mb-0.5">
                        Pro Strategy:
                      </strong>
                      <span>{section.tip}</span>
                    </div>
                  </div>
                )}
              </section>
            ))}

            {/* Conclusion */}
            <div className="pt-6 border-t border-[#A7D6C0]/40">
              <h3 className="text-xl font-bold text-[#143026] mb-3">
                Final Institutional Thought
              </h3>
              <p className="text-base text-[#385e4f] leading-relaxed">
                {post.content.conclusion}
              </p>
            </div>
          </div>

          {/* Bottom Share & Portal CTA Bar */}
          <div className="my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-nexhire-md">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold text-white">
                Ready to put these strategies to work?
              </h4>
              <p className="text-xs text-white/90">
                Sign in to your NexHire account to explore opportunities, track interviews, and receive verified offers.
              </p>
            </div>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-white text-[#143026] hover:bg-[#EAF6F0] text-xs font-bold shadow-md transition whitespace-nowrap shrink-0"
            >
              Sign In to Portal
            </Link>
          </div>

          {/* Related Articles Section */}
          <div className="pt-8 border-t border-[#A7D6C0]/50">
            <h3 className="text-xl font-extrabold text-[#143026] mb-6">
              Related Strategic Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <article
                  key={related.slug}
                  className="p-6 rounded-2xl bg-white border border-[#A7D6C0]/70 shadow-2xs hover:shadow-nexhire-sm transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#2E9D74]">
                      <span>{related.category}</span>
                      <span>&bull;</span>
                      <span className="text-[#527566]">{related.readTime}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#143026] group-hover:text-[#2E9D74] transition-colors mb-2 line-clamp-2">
                      <Link to={`/blog/${related.slug}`}>
                        {related.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-[#527566] line-clamp-2 mb-4">
                      {related.excerpt}
                    </p>
                  </div>
                  <Link
                    to={`/blog/${related.slug}`}
                    className="text-xs font-bold text-[#2E9D74] flex items-center gap-1 group-hover:underline"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
};
