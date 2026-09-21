import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { COUNTRY_PHONE_CODES, CountryPhoneConfig } from '../../lib/mariluna/phoneUtils';

interface PhoneInputFieldProps {
  countryCode: string;
  phoneNumber: string;
  onChangeCountryCode: (code: string) => void;
  onChangePhoneNumber: (number: string) => void;
  error?: string;
  isNl?: boolean;
  disabled?: boolean;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  countryCode,
  phoneNumber,
  onChangeCountryCode,
  onChangePhoneNumber,
  error,
  isNl = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected country config or default to +32 (Belgium) if not set
  const activeCountry =
    COUNTRY_PHONE_CODES.find((c) => c.code === countryCode) ||
    COUNTRY_PHONE_CODES[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredCountries = COUNTRY_PHONE_CODES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nameNl.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      c.iso.toLowerCase().includes(q)
    );
  });

  const handleSelectCountry = (country: CountryPhoneConfig) => {
    onChangeCountryCode(country.code);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
        {isNl ? 'Telefoonnummer / GSM' : 'Phone number / Mobile'}
      </label>

      <div className="flex items-stretch gap-2">
        {/* Country Code Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="h-11 px-3 flex items-center gap-1.5 rounded-xl bg-white border border-[#DDD4C5] text-xs font-medium text-[#2C2825] hover:border-[#8C7654] transition cursor-pointer select-none whitespace-nowrap shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
            aria-label={isNl ? 'Selecteer landcode' : 'Select country code'}
            aria-expanded={isOpen}
          >
            <span className="text-base leading-none" role="img" aria-label={activeCountry.nameNl}>
              {activeCountry.flag}
            </span>
            <span className="font-mono text-xs text-[#2C2825]">{countryCode || activeCountry.code}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8C7654] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 max-w-[85vw] bg-[#FAF8F3] border border-[#DDD4C5] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar */}
              <div className="p-2 border-b border-[#EAE2D3] bg-[#F5EFEB]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-[#DDD4C5]">
                  <Search className="w-3.5 h-3.5 text-[#8C7654]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isNl ? 'Zoek land of code...' : 'Search country or code...'}
                    className="w-full text-xs text-[#2C2825] bg-transparent outline-none placeholder:text-[#A49A8D]"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="overflow-y-auto flex-1 p-1 divide-y divide-[#EFE8DC]/50">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#7A7167]">
                    {isNl ? 'Geen landen gevonden' : 'No countries found'}
                  </div>
                ) : (
                  filteredCountries.map((country) => {
                    const isSelected = country.code === (countryCode || activeCountry.code);
                    return (
                      <button
                        key={country.iso}
                        type="button"
                        onClick={() => handleSelectCountry(country)}
                        className={`w-full px-3 py-2 flex items-center justify-between text-left rounded-xl transition cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-[#EFE8DC] font-medium text-[#2C2825]'
                            : 'hover:bg-[#F3EDE2] text-[#4A433B]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base leading-none">{country.flag}</span>
                          <span className="truncate">{isNl ? country.nameNl : country.nameEn}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[11px] text-[#7A7167]">{country.code}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#8C7654]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Phone Number Input */}
        <div className="flex-1">
          <input
            type="tel"
            disabled={disabled}
            value={phoneNumber}
            onChange={(e) => onChangePhoneNumber(e.target.value)}
            placeholder={activeCountry.example}
            className={`w-full h-11 px-3.5 rounded-xl bg-white border text-xs text-[#2C2825] placeholder:text-[#A49A8D] transition shadow-2xs focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-300 bg-red-50/20'
                : 'border-[#DDD4C5] focus:border-[#8C7654] focus:ring-[#8C7654]'
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 font-normal px-1">
          {error}
        </p>
      )}
    </div>
  );
};
