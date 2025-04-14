import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import axios from "axios";

const Container = styled.div`
  position: relative;
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ccc;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
  z-index: 1000;
`;

const SuggestionItem = styled.li`
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }

  &:active {
    background-color: #e0e0e0;
  }
`;

const AutocompleteInput = ({ value, onChange, onSelect, placeholder, InputComponent }) => {
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const selectingRef = useRef(false);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || justSelectedRef.current) {
        justSelectedRef.current = false;
        return setSuggestions([]);
      }

      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json`,
          {
            params: {
              access_token: import.meta.env.VITE_API_TOKEN,
              autocomplete: true,
              limit: 3,
              types: "place",
              language: "en",
            },
          }
        );

        const formattedSuggestions = response.data.features.map((place) => {
          const context = place.context || [];
        
          const region = context.find(c => c.id.startsWith("region"));
          const country = context.find(c => c.id.startsWith("country"));
        
          let regionAbbreviation = "";
          let countryCode = "";
        
          if (region?.short_code) {
            const [countryPart, statePart] = region.short_code.split("-");
        
            if (statePart && /^[A-Z]{2}$/.test(statePart)) {
              regionAbbreviation = statePart.toUpperCase();
              countryCode = countryPart.toUpperCase();
            }
          }
        
          if (!regionAbbreviation && country?.short_code) {
            countryCode = country.short_code.toUpperCase();
          }
        
          let fullName = place.text;
        
          if (regionAbbreviation) {
            fullName += `, ${regionAbbreviation}`;
          }
        
          if (countryCode) {
            fullName += `, ${countryCode}`;
          }
        
          // If it's a unique place (like Helsinki), omit the region and only show the country.
          // Ensure that numeric or non-standard region codes are skipped.
          if (!regionAbbreviation && countryCode) {
            fullName = `${place.text}, ${countryCode}`;
          }
        
          return {
            id: place.id,
            fullName,
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBlur = () => {
    setTimeout(() => {
      if (!selectingRef.current) {
        if (suggestions.length > 0 && value !== suggestions[0].fullName) {
          justSelectedRef.current = true;
          onSelect(suggestions[0].fullName);
        }
        setSuggestions([]);
      }
    }, 100);
  };

  const handleFocus = () => {
    selectingRef.current = false;
  };

  const handleSuggestionSelect = (fullName) => {
    selectingRef.current = true;
    justSelectedRef.current = true;
    onSelect(fullName);
    setSuggestions([]);
    if (inputRef.current?.blur) {
      inputRef.current.blur();
    }
  };

  return (
    <Container ref={containerRef}>
      <InputComponent
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
      />
      {suggestions.length > 0 && (
        <SuggestionsList>
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionSelect(suggestion.fullName);
              }}
            >
              {suggestion.fullName}
            </SuggestionItem>
          ))}
        </SuggestionsList>
      )}
    </Container>
  );
};

export default AutocompleteInput;