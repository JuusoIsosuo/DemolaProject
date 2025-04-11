import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const AutocompleteInput = ({ value, onChange, onSelect, placeholder, InputComponent }) => {
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value) return setSuggestions([]);
      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json`,
          {
            params: {
              access_token: import.meta.env.VITE_API_TOKEN,
              autocomplete: true,
              limit: 3,
              types: 'place',
              language: 'en',
            },
          }
        );
        const formattedSuggestions = response.data.features.map((place) => {
          const countryCode = place.context?.find(c => c.id.startsWith('country'))?.short_code?.toUpperCase() || '';
          return {
            id: place.id,
            fullName: `${place.text}, ${countryCode}`,
            place,
          };
        });
        setSuggestions(formattedSuggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    const handleTabOut = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleTabOut); // Listen for tabbing away
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleTabOut); // Clean up event listener
    };
  }, []);

  const handleBlur = () => {
    if (suggestions.length > 0 && value !== suggestions[0].fullName) {
      onSelect(suggestions[0].fullName);
    }
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <InputComponent
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onBlur={handleBlur}
      />
      {suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            listStyle: "none",
            padding: "0.5rem 0",
            margin: 0,
            zIndex: 1000,
          }}
        >
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              onClick={() => {
                onSelect(suggestion.fullName);
                setSuggestions([]);
              }}
              style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
            >
              {suggestion.fullName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;