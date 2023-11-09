import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CardsGallery from '@site/src/components/CardsGallery';
import Heading from '@theme/Heading';
import React, { useState, useEffect } from "react";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { initializeIcons } from "@fluentui/react/lib/Icons";

import styles from './index.module.css';

initializeIcons();

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <SearchBox
          styles={{
            root: {
              width: '100%',
              border: "1px solid #D1D1D1",
              height: "52px",
              maxWidth: "740px",
              borderRadius: "4px",
            },
            icon: {
              fontSize: "24px",
              paddingLeft: "10px",
            },
            field: {
              paddingLeft: "20px",
              fontSize: "18px",
            },
          }}
          id="filterBar"
          placeholder="Search for a Power Platform GitHub repository..." 
        />
        {/* 
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Docusaurus Tutorial - 5min ⏱️
          </Link>
        </div>
        */}
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <CardsGallery />
      </main>
    </Layout>
  );
}
