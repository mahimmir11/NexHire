import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { BLOG_POSTS } from '../../data/blogData';
import {
  Search,
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(BLOG_POSTS.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredPost = useMemo(() => {
    return BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  }, []);

  // When no filter is active, highlight the featured post separately
  const showFeaturedHero = selectedCategory === 'All' && searchQuery.trim() === '';
  const listPosts = showFeaturedHero
    ? filteredPosts.filter((p) => p.slug !== featuredPost.slug)
    : filteredPosts;

  return (
    <PublicLayout>
      <div className="py-12 sm:py-20 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A7D6C0]/30 rounded-full blur-3xl"></div>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#61B795]/15 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Blog Page Header */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Campus Recruitment Journal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-[#143026] tracking-tight leading-tight">
              The NexHire Publication
            </h1>

            <p className="text-base sm:text-lg text-[#466a5b] mt-3 leading-relaxed">
              Curated guides, strategic placement advice, recruiter insights, and institutional blueprints for the modern campus career ecosystem.
            </p>
          </div>

          {/* Controls: Search Bar & Categories */}
          <div className="mb-12 space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#527566]" />
                <input
                  type="text"
                  placeholder="Search articles, interview tips, strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#A7D6C0]/80 text-xs text-[#143026] placeholder-[#8baaa0] focus:outline-none focus:ring-2 focus:ring-[#2E9D74] focus:border-transparent shadow-xs transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#527566] hover:text-[#143026]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-xs font-semibold text-[#527566]">
                Showing {filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2E9D74] text-white shadow-sm'
                        : 'bg-white hover:bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0]/60'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Hero Article (Shown when no search/filter active) */}
          {showFeaturedHero && featuredPost && (
            <div className="mb-16">
              <div className="glass-card rounded-3xl sm:rounded-4xl overflow-hidden border border-[#A7D6C0]/80 shadow-nexhire-md bg-white group transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Left Visual Area */}
                  <div className={`lg:col-span-5 bg-gradient-to-br ${featuredPost.coverGradient} p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden min-h-[280px]`}>
                    <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        Featured Strategic Guide
                      </span>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-white/80 block uppercase tracking-wider">
                          Key Focus Area
                        </span>
                        <p className="text-lg font-bold text-white leading-snug">
                          {featuredPost.category}
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10 pt-8 flex items-center justify-between text-xs text-white/80">
                      <span>{featuredPost.readTime}</span>
                      <span>{featuredPost.date}</span>
                    </div>
                  </div>

                  {/* Right Content Area */}
                  <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74]">
                          {featuredPost.category}
                        </span>
                        <span className="text-[#A7D6C0]">&bull;</span>
                        <span className="text-xs text-[#527566] font-medium">
                          {featuredPost.readTime}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#143026] group-hover:text-[#2E9D74] transition-colors leading-tight mb-4">
                        <Link to={`/blog/${featuredPost.slug}`}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      <p className="text-sm sm:text-base text-[#466a5b] leading-relaxed mb-6">
                        {featuredPost.excerpt}
                      </p>

                      {/* Author badge */}
                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-9 h-9 rounded-full bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center font-bold text-xs text-[#2E9D74]">
                          {featuredPost.author.avatarInitials}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#143026] block">
                            {featuredPost.author.name}
                          </span>
                          <span className="text-[11px] text-[#527566]">
                            {featuredPost.author.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#A7D6C0]/30 flex items-center justify-between">
                      <span className="text-xs text-[#527566]">
                        Published on {featuredPost.date}
                      </span>
                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-sm transition group/btn"
                      >
                        <span>Read Full Guide</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Article Cards Grid */}
          {listPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {listPosts.map((post) => (
                <article
                  key={post.slug}
                  className="glass-card rounded-3xl overflow-hidden border border-[#A7D6C0]/70 bg-white shadow-xs hover:shadow-nexhire-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Visual accent top strip */}
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

                      {/* Author */}
                      <div className="flex items-center gap-2.5 pt-2">
                        <div className="w-7 h-7 rounded-full bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center font-bold text-[10px] text-[#2E9D74]">
                          {post.author.avatarInitials}
                        </div>
                        <span className="text-xs font-semibold text-[#143026]">
                          {post.author.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-7 pb-7 pt-4 border-t border-[#A7D6C0]/30 mt-auto flex items-center justify-between text-xs">
                    <span className="text-[#527566] text-[11px]">
                      {post.date}
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-xs font-bold text-[#2E9D74] hover:text-[#258260] flex items-center gap-1 group-hover:underline"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-white/80 rounded-3xl border border-[#A7D6C0]/60 p-8">
              <BookOpen className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#143026] mb-1">
                No matching articles found
              </h3>
              <p className="text-xs text-[#527566] max-w-sm mx-auto mb-4">
                We couldn't find any articles matching "{searchQuery}". Try searching for another topic or clear filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-xl bg-[#2E9D74] text-white text-xs font-bold"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
