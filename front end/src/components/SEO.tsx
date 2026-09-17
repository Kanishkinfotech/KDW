import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  type?: string;
  image?: string;
  keywords?: string;
  canonical?: string;
}

export default function SEO({ title, description, type = 'website', image, keywords, canonical }: SEOProps) {
  const siteName = 'Kanishk Digital World';
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      {keywords && <meta name='keywords' content={keywords} />}
      {canonical && <link rel='canonical' href={canonical} />}
      
      {/* OpenGraph tags */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:type' content={type} />
      {image && <meta property='og:image' content={image} />}
      
      {/* Twitter Card tags */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      {image && <meta name='twitter:image' content={image} />}
    </Helmet>
  );
}
