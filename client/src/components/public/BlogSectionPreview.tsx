import React from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../data/blogData';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';

export const BlogSectionPreview: React.FC = () => {
  // Show first 3 posts
  const previewPosts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="py-20 sm:py-28 bg-[#EAF6F0] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#A7D6C0]/20 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Campus Career Publications</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#143026] tracking-tight">
              Latest from NexHire
            </h2>

            <p className="text-base text-[#466a5b] max-w-xl">
              Strategic career playbooks, campus recruitment trends, and placement management best practices.
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#2E9D74] text-[#143026] hover:text-white border border-[#A7D6C0]/80 hover:border-[#2E9D74] text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-200 self-start sm:self-auto group"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3 Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {previewPosts.map((post) => (
            <article
              key={post.slug}
              className="glass-card rounded-3xl overflow-hidden border border-[#A7D6C0]/70 bg-white shadow-xs hover:shadow-nexhire-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Visual Header Accent Strip */}
                <div className={`h-3 bg-gradient-to-r ${post.coverGradient}`}></div>

                <div className="p-7">
                  {/* Category & Read Time */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/50">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#527566]">
                      <Clock className="w-3 h-3 text-[#2E9D74]" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#143026] group-hover:text-[#2E9D74] transition-colors leading-snug mb-3 line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs sm:text-sm text-[#466a5b] leading-relaxed line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div className="px-7 pb-7 pt-0 border-t border-[#A7D6C0]/30 mt-auto flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#527566] font-medium pt-4">
                  <Calendar className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>{post.date}</span>
                </div>

                <Link
                  to={`/blog/${post.slug}`}
                  className="pt-4 text-xs font-bold text-[#2E9D74] hover:text-[#258260] flex items-center gap-1 group-hover:underline"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
