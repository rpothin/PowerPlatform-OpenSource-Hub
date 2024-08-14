"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[89],{4351:(e,t,a)=>{a.r(t),a.d(t,{default:()=>j});a(7294);var n=a(512),s=a(2263),r=a(8264),i=a(5281),l=a(1059),o=a(9703),c=a(197),d=a(9985),g=a(5742),m=a(3548),u=a(5893);function h(e){const t=(0,m.CS)(e);return(0,u.jsx)(g.Z,{children:(0,u.jsx)("script",{type:"application/ld+json",children:JSON.stringify(t)})})}function p(e){const{metadata:t}=e,{siteConfig:{title:a}}=(0,s.Z)(),{blogDescription:n,blogTitle:i,permalink:l}=t,o="/"===l?a:i;return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(r.d,{title:o,description:n}),(0,u.jsx)(c.Z,{tag:"blog_posts_list"})]})}function x(e){const{metadata:t,items:a,sidebar:n}=e;return(0,u.jsxs)(l.Z,{sidebar:n,children:[(0,u.jsx)(d.Z,{items:a}),(0,u.jsx)(o.Z,{metadata:t})]})}function j(e){return(0,u.jsxs)(r.FG,{className:(0,n.Z)(i.k.wrapper.blogPages,i.k.page.blogListPage),children:[(0,u.jsx)(p,{...e}),(0,u.jsx)(h,{...e}),(0,u.jsx)(x,{...e})]})}},9703:(e,t,a)=>{a.d(t,{Z:()=>i});a(7294);var n=a(5999),s=a(2244),r=a(5893);function i(e){const{metadata:t}=e,{previousPage:a,nextPage:i}=t;return(0,r.jsxs)("nav",{className:"pagination-nav","aria-label":(0,n.I)({id:"theme.blog.paginator.navAriaLabel",message:"Blog list page navigation",description:"The ARIA label for the blog pagination"}),children:[a&&(0,r.jsx)(s.Z,{permalink:a,title:(0,r.jsx)(n.Z,{id:"theme.blog.paginator.newerEntries",description:"The label used to navigate to the newer blog posts page (previous page)",children:"Newer entries"})}),i&&(0,r.jsx)(s.Z,{permalink:i,title:(0,r.jsx)(n.Z,{id:"theme.blog.paginator.olderEntries",description:"The label used to navigate to the older blog posts page (next page)",children:"Older entries"}),isNext:!0})]})}},1161:(e,t,a)=>{a.d(t,{Z:()=>C});a(7294);var n=a(512),s=a(3548),r=a(5893);function i(e){let{children:t,className:a}=e;return(0,r.jsx)("article",{className:a,children:t})}var l=a(3692);const o={title:"title_f1Hy"};function c(e){let{className:t}=e;const{metadata:a,isBlogPostPage:i}=(0,s.nO)(),{permalink:c,title:d}=a,g=i?"h1":"h2";return(0,r.jsx)(g,{className:(0,n.Z)(o.title,t),children:i?d:(0,r.jsx)(l.Z,{to:c,children:d})})}var d=a(5999),g=a(8824),m=a(9788);const u={container:"container_mt6G"};function h(e){let{readingTime:t}=e;const a=function(){const{selectMessage:e}=(0,g.c)();return t=>{const a=Math.ceil(t);return e(a,(0,d.I)({id:"theme.blog.post.readingTime.plurals",description:'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',message:"One min read|{readingTime} min read"},{readingTime:a}))}}();return(0,r.jsx)(r.Fragment,{children:a(t)})}function p(e){let{date:t,formattedDate:a}=e;return(0,r.jsx)("time",{dateTime:t,children:a})}function x(){return(0,r.jsx)(r.Fragment,{children:" \xb7 "})}function j(e){let{className:t}=e;const{metadata:a}=(0,s.nO)(),{date:i,readingTime:l}=a,o=(0,m.P)({day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});return(0,r.jsxs)("div",{className:(0,n.Z)(u.container,"margin-vert--md",t),children:[(0,r.jsx)(p,{date:i,formattedDate:(c=i,o.format(new Date(c)))}),void 0!==l&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(x,{}),(0,r.jsx)(h,{readingTime:l})]})]});var c}var b=a(6788);const f={authorCol:"authorCol_Hf19",imageOnlyAuthorRow:"imageOnlyAuthorRow_pa_O",imageOnlyAuthorCol:"imageOnlyAuthorCol_G86a"};function v(e){let{className:t}=e;const{metadata:{authors:a},assets:i}=(0,s.nO)();if(0===a.length)return null;const l=a.every((e=>{let{name:t}=e;return!t})),o=1===a.length;return(0,r.jsx)("div",{className:(0,n.Z)("margin-top--md margin-bottom--sm",l?f.imageOnlyAuthorRow:"row",t),children:a.map(((e,t)=>(0,r.jsx)("div",{className:(0,n.Z)(!l&&(o?"col col--12":"col col--6"),l?f.imageOnlyAuthorCol:f.authorCol),children:(0,r.jsx)(b.Z,{author:{...e,imageURL:i.authorsImageUrls[t]??e.imageURL}})},t)))})}function Z(){return(0,r.jsxs)("header",{children:[(0,r.jsx)(c,{}),(0,r.jsx)(j,{}),(0,r.jsx)(v,{})]})}var N=a(8780),k=a(7395);function _(e){let{children:t,className:a}=e;const{isBlogPostPage:i}=(0,s.nO)();return(0,r.jsx)("div",{id:i?N.uR:void 0,className:(0,n.Z)("markdown",a),children:(0,r.jsx)(k.Z,{children:t})})}var w=a(5281),T=a(7265),y=a(1526);function O(){return(0,r.jsx)("b",{children:(0,r.jsx)(d.Z,{id:"theme.blog.post.readMore",description:"The label used in blog post item excerpts to link to full blog posts",children:"Read more"})})}function P(e){const{blogPostTitle:t,...a}=e;return(0,r.jsx)(l.Z,{"aria-label":(0,d.I)({message:"Read more about {title}",id:"theme.blog.post.readMoreLabel",description:"The ARIA label for the link to full blog posts from excerpts"},{title:t}),...a,children:(0,r.jsx)(O,{})})}function R(){const{metadata:e,isBlogPostPage:t}=(0,s.nO)(),{tags:a,title:i,editUrl:l,hasTruncateMarker:o,lastUpdatedBy:c,lastUpdatedAt:d}=e,g=!t&&o,m=a.length>0;if(!(m||g||l))return null;if(t){const e=!!(l||d||c);return(0,r.jsxs)("footer",{className:"docusaurus-mt-lg",children:[m&&(0,r.jsx)("div",{className:(0,n.Z)("row","margin-top--sm",w.k.blog.blogFooterEditMetaRow),children:(0,r.jsx)("div",{className:"col",children:(0,r.jsx)(y.Z,{tags:a})})}),e&&(0,r.jsx)(T.Z,{className:(0,n.Z)("margin-top--sm",w.k.blog.blogFooterEditMetaRow),editUrl:l,lastUpdatedAt:d,lastUpdatedBy:c})]})}return(0,r.jsxs)("footer",{className:"row docusaurus-mt-lg",children:[m&&(0,r.jsx)("div",{className:(0,n.Z)("col",{"col--9":g}),children:(0,r.jsx)(y.Z,{tags:a})}),g&&(0,r.jsx)("div",{className:(0,n.Z)("col text--right",{"col--3":m}),children:(0,r.jsx)(P,{blogPostTitle:i,to:e.permalink})})]})}function C(e){let{children:t,className:a}=e;const l=function(){const{isBlogPostPage:e}=(0,s.nO)();return e?void 0:"margin-bottom--xl"}();return(0,r.jsxs)(i,{className:(0,n.Z)(l,a),children:[(0,r.jsx)(Z,{}),(0,r.jsx)(_,{children:t}),(0,r.jsx)(R,{})]})}},9985:(e,t,a)=>{a.d(t,{Z:()=>i});a(7294);var n=a(3548),s=a(1161),r=a(5893);function i(e){let{items:t,component:a=s.Z}=e;return(0,r.jsx)(r.Fragment,{children:t.map((e=>{let{content:t}=e;return(0,r.jsx)(n.n4,{content:t,children:(0,r.jsx)(a,{children:(0,r.jsx)(t,{})})},t.metadata.permalink)}))})}},2244:(e,t,a)=>{a.d(t,{Z:()=>i});a(7294);var n=a(512),s=a(3692),r=a(5893);function i(e){const{permalink:t,title:a,subLabel:i,isNext:l}=e;return(0,r.jsxs)(s.Z,{className:(0,n.Z)("pagination-nav__link",l?"pagination-nav__link--next":"pagination-nav__link--prev"),to:t,children:[i&&(0,r.jsx)("div",{className:"pagination-nav__sublabel",children:i}),(0,r.jsx)("div",{className:"pagination-nav__label",children:a})]})}},3008:(e,t,a)=>{a.d(t,{Z:()=>l});a(7294);var n=a(512),s=a(3692);const r={tag:"tag_zVej",tagRegular:"tagRegular_sFm0",tagWithCount:"tagWithCount_h2kH"};var i=a(5893);function l(e){let{permalink:t,label:a,count:l,description:o}=e;return(0,i.jsxs)(s.Z,{href:t,title:o,className:(0,n.Z)(r.tag,l?r.tagWithCount:r.tagRegular),children:[a,l&&(0,i.jsx)("span",{children:l})]})}},1526:(e,t,a)=>{a.d(t,{Z:()=>o});a(7294);var n=a(512),s=a(5999),r=a(3008);const i={tags:"tags_jXut",tag:"tag_QGVx"};var l=a(5893);function o(e){let{tags:t}=e;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("b",{children:(0,l.jsx)(s.Z,{id:"theme.tags.tagsListLabel",description:"The label alongside a tag list",children:"Tags:"})}),(0,l.jsx)("ul",{className:(0,n.Z)(i.tags,"padding--none","margin-left--sm"),children:t.map((e=>(0,l.jsx)("li",{className:i.tag,children:(0,l.jsx)(r.Z,{...e})},e.permalink)))})]})}}}]);