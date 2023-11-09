import React, { useState, useEffect } from 'react';
import data from '../../../../Data/GitHubRepositoriesDetails.json';

interface Repository {
    fullName: string;
    description: string;
    // Add more properties as needed
}

function CardsGallery() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        setItems(data);
    }, []);

    return (
        <div className="card-container">
            {items.map((item, index) => (
                <div key={index} className="card">
                    <h2>{item.fullName}</h2>
                    <p>{item.description}</p>
                    {/* Add more details as needed */}
                </div>
            ))}
        </div>
    );
}

export default CardsGallery;