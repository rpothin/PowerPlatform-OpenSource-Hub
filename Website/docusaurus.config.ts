import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Power Platform Open-Source Hub',
  tagline: 'Discover open-source projects for Microsoft Power Platform and Copilot Studio 🧳',
  favicon: 'img/PowerPlatform_scalable.svg', //'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://rpothin.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/PowerPlatform-OpenSource-Hub/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'rpothin', // Usually your GitHub org/user name.
  projectName: 'PowerPlatform-OpenSource-Hub', // Usually your repo name.

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.ts'),
          editUrl:
            'https://github.com/rpothin/PowerPlatform-OpenSource-Hub/edit/main/Website/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  headTags: [
    {
      tagName: 'script',
      attributes: {
        type: 'text/javascript',
      },
      innerHTML: `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "kzw09thgnq");
      `,
    },
  ],

  plugins: [],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    navbar: {
      title: 'Power Platform OSS Hub',
      logo: {
        alt: 'Power Platform Open-Source Hub Logo',
        src: 'img/PowerPlatform_scalable.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/gallery', label: 'Gallery', position: 'left' },
        /*{to: '/blog', label: 'Blog', position: 'left'},*/
        {
          href: 'https://github.com/rpothin/PowerPlatform-OpenSource-Hub',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          label: "Inspired by Awesome AZD",
          to: "https://azure.github.io/awesome-azd/",
        },
        {
          label: "Built with Docusaurus",
          to: "https://docusaurus.io",
        },
        {
          label: `Monitored with Microsoft Clarity`,
          to: "https://learn.microsoft.com/en-us/clarity/faq#privacy",
        },
        {
          label: `Copyright © ${new Date().getFullYear()} Raphael Pothin`,
          to: "https://github.com/rpothin/",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
