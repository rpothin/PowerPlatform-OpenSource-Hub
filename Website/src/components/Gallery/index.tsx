// Importing necessary libraries and components
import React, { useState } from 'react';
import { DocumentCard, DocumentCardDetails, DocumentCardTitle, Dialog, DialogType, Link } from '@fluentui/react';
import styles from './styles.module.css'

// Filter the items based on the selected criteria in the FilterPane
function filterItems(items, hasGoodFirstIssueChecked, selectedTopics, selectedLanguages) {
    let filteredItems = items;

    // Filter based on 'hasGoodFirstIssues' status
    if (hasGoodFirstIssueChecked) {
        filteredItems = filteredItems.filter(item => item.hasGoodFirstIssues);
    }

    // Filter based on selected topics - should include all selected topics
    if (selectedTopics.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedTopics.every(topic => item.topics.includes(topic))
        );
    }

    // Filter based on selected languages - should include all selected languages
    if (selectedLanguages.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedLanguages.every(language => item.languages.includes(language))
        );
    }

    return filteredItems;
}

// Defining the Gallery component
const Gallery = ({ items, hasGoodFirstIssueChecked, selectedTopics = [], selectedLanguages = [] }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [hideDialog, setHideDialog] = useState(true);
    
    // Filter items based on selected criteria
    const filteredItems = filterItems(items, hasGoodFirstIssueChecked, selectedTopics, selectedLanguages);

    const openDialog = (item) => {
        setSelectedItem(item);
        setHideDialog(false);
    }

    const closeDialog = () => {
        setHideDialog(true);
    }

    // Rendering the Gallery component
    return (
        <div className={styles.gallery}>
            {filteredItems.map((item, index) => (
                <DocumentCard className={styles.galleryItem} key={index}>
                    <DocumentCardDetails>
                        <DocumentCardTitle className={styles.galleryItemTitle} title={item.fullName} />
                        <div className={styles.galleryItemSubtitle}>
                            {item.description.length > 300 ? 
                                <p>
                                    {item.description.substring(0, 300) + '... '}
                                    <Link onClick={() => openDialog(item)}>See more</Link>
                                </p> 
                            : 
                                item.description
                            }
                        </div>
                        <DocumentCardTitle className={styles.galleryItemStarsCount} title={`⭐ ${item.stargazerCount}`} shouldTruncate showAsSecondaryTitle />
                        <div className={styles.badges}>
                            {item.hasGoodFirstIssues && 
                                <img alt="HasGoodFirstIssueBadge" src="https://img.shields.io/badge/Has%20Good%201st%20Issue-7057ff" />
                            }
                        </div>
                    </DocumentCardDetails>
                </DocumentCard>
            ))}
            <Dialog
                hidden={hideDialog}
                onDismiss={closeDialog}
                dialogContentProps={{
                    type: DialogType.largeHeader,
                    title: selectedItem?.fullName,
                    subText: selectedItem?.description
                }}
            />
        </div>
    );
};

// Exporting the Gallery component
export default Gallery;