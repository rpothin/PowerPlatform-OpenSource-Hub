import { DocumentCard, DocumentCardDetails, DocumentCardTitle } from '@fluentui/react';
import styles from './styles.module.css'

const Gallery = ({ items, selectedTopics = [], selectedLanguages = [] }) => {
    const filteredItems = items.filter(item =>
        selectedTopics.length === 0 || (item.topic && selectedTopics.some(topic => item.topic.includes(topic)))
    );

    return (
        <div className={styles.gallery}>
            {filteredItems.map((item, index) => (
                <DocumentCard className={styles.galleryItem} key={index}>
                    <DocumentCardDetails>
                        <DocumentCardTitle className={styles.galleryItemTitle} title={item.fullName} />
                        <DocumentCardTitle className={styles.galleryItemSubtitle} title={item.description} shouldTruncate showAsSecondaryTitle />
                        <DocumentCardTitle className={styles.galleryItemStarsCount} title={`⭐ ${item.stargazerCount}`} shouldTruncate showAsSecondaryTitle />
                    </DocumentCardDetails>
                </DocumentCard>
            ))}
        </div>
    );
};

export default Gallery;