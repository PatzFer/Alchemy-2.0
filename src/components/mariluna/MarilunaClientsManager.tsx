import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { MarilunaClient, IntegrationsState, MarilunaOffering } from '../../types';
import { PhoneInputField } from './PhoneInputField';
import {
  normalizePhoneNumber,
  validatePhoneNumber,
  formatE164ForDisplay,
  COUNTRY_PHONE_CODES,
} from '../../lib/mariluna/phoneUtils';

interface MarilunaClientsManagerProps {
  clients: MarilunaClient[];
  onUpdateClients: (clients: MarilunaClient[]) => void;
  offerings?: MarilunaOffering[];
  integrations?: IntegrationsState;
  isNl?: boolean;
}

type ClientFilter = 'all' | 'has_email' | 'has_phone';

export const MarilunaClientsManager: React.FC<MarilunaClientsManagerProps> = ({
  clients = [],
  onUpdateClients,
  offerings = [],
  integrations,
  isNl = true,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ClientFilter>('all');

  // Modal / Drawer states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+32');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<MarilunaClient['status']>('active');

  // Form Validation & Feedback
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    general?: string;
  }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{
    type: 'email' | 'phone';
    existingClient: MarilunaClient;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger brief toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Open Form for New Client
  const handleOpenNewClient = () => {
    setEditingClientId(null);
    setFirstName('');
    setLastName('');
    setCompany('');
    setEmail('');
    setCountryCode('+32');
    setPhoneNumber('');
    setNotes('');
    setStatus('active');
    setFormErrors({});
    setDuplicateWarning(null);
    setIsFormModalOpen(true);
  };

  // Open Form for Editing Existing Client
  const handleOpenEditClient = (cli: MarilunaClient) => {
    setEditingClientId(cli.id);

    // Extract first & last name if not explicitly set
    let fName = cli.firstName || '';
    let lName = cli.lastName || '';
    if (!fName && cli.name) {
      const parts = cli.name.trim().split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    setFirstName(fName);
    setLastName(lName);
    setCompany(cli.company || '');
    setEmail(cli.email || '');
    setCountryCode(cli.countryCode || '+32');
    setPhoneNumber(cli.phoneNumber || (cli.phone ? cli.phone.replace(/^\+\d+/, '').trim() : ''));
    setNotes(cli.notes || '');
    setStatus(cli.status || 'active');
    setFormErrors({});
    setDuplicateWarning(null);
    setIsFormModalOpen(true);
  };

  // Save Client Form
  const handleSaveClientForm = (forceSave: boolean = false) => {
    const errors: typeof formErrors = {};
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedFirst) {
      errors.firstName = isNl ? 'Voornaam is verplicht.' : 'First name is required.';
    }
    if (!trimmedLast) {
      errors.lastName = isNl ? 'Achternaam is verplicht.' : 'Last name is required.';
    }

    if (trimmedPhone) {
      const phoneVal = validatePhoneNumber(countryCode, trimmedPhone);
      if (!phoneVal.isValid) {
        errors.phone = phoneVal.errorMessage || (isNl ? 'Controleer het telefoonnummer.' : 'Check phone number.');
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Duplicate check for new clients (or when email/phone is changed)
    if (!forceSave) {
      if (trimmedEmail) {
        const existingWithEmail = clients.find(
          (c) => c.id !== editingClientId && c.email?.toLowerCase() === trimmedEmail.toLowerCase()
        );
        if (existingWithEmail) {
          setDuplicateWarning({ type: 'email', existingClient: existingWithEmail });
          return;
        }
      }

      if (trimmedPhone) {
        const norm = normalizePhoneNumber(countryCode, trimmedPhone);
        if (norm.phoneE164) {
          const existingWithPhone = clients.find(
            (c) => c.id !== editingClientId && c.phoneE164 === norm.phoneE164
          );
          if (existingWithPhone) {
            setDuplicateWarning({ type: 'phone', existingClient: existingWithPhone });
            return;
          }
        }
      }
    }

    // Prepare normalized phone data
    let phoneE164: string | undefined = undefined;
    let formattedDisplay: string | undefined = undefined;
    if (trimmedPhone) {
      const norm = normalizePhoneNumber(countryCode, trimmedPhone);
      phoneE164 = norm.phoneE164;
      formattedDisplay = norm.formattedDisplay;
    }

    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const nowIso = new Date().toISOString();

    if (editingClientId) {
      // Update existing
      const updated = clients.map((cli) => {
        if (cli.id !== editingClientId) return cli;
        return {
          ...cli,
          name: fullName,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          company: company.trim() || undefined,
          email: trimmedEmail || undefined,
          countryCode: trimmedPhone ? countryCode : undefined,
          phoneNumber: trimmedPhone || undefined,
          phoneE164: phoneE164,
          phone: formattedDisplay,
          notes: notes.trim() || undefined,
          status,
          updatedAt: nowIso,
        };
      });
      onUpdateClients(updated);
      showToast(isNl ? 'Klantenkaart opgeslagen.' : 'Client saved.');
    } else {
      // Create new
      const newClient: MarilunaClient = {
        id: `cli-${Date.now()}`,
        name: fullName,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        company: company.trim() || undefined,
        email: trimmedEmail || undefined,
        countryCode: trimmedPhone ? countryCode : undefined,
        phoneNumber: trimmedPhone || undefined,
        phoneE164: phoneE164,
        phone: formattedDisplay,
        notes: notes.trim() || undefined,
        status,
        createdAt: nowIso.split('T')[0],
      };
      onUpdateClients([...clients, newClient]);
      showToast(isNl ? 'Klant toegevoegd.' : 'Client added.');
    }

    setIsFormModalOpen(false);
    setDuplicateWarning(null);
  };

  // Confirm Delete Client
  const handleConfirmDelete = () => {
    if (!deletingClientId) return;
    const filtered = clients.filter((c) => c.id !== deletingClientId);
    onUpdateClients(filtered);
    if (selectedClientId === deletingClientId) {
      setSelectedClientId(null);
    }
    setDeletingClientId(null);
    showToast(isNl ? 'Klant verwijderd.' : 'Client removed.');
  };

  // Filter & Search computation
  const filteredClients = useMemo(() => {
    return clients.filter((cli) => {
      // Filter tab check
      if (activeFilter === 'has_email' && !cli.email) return false;
      if (activeFilter === 'has_phone' && !cli.phoneNumber && !cli.phone && !cli.phoneE164) return false;

      // Search query check
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const fName = (cli.firstName || '').toLowerCase();
      const lName = (cli.lastName || '').toLowerCase();
      const fullName = (cli.name || '').toLowerCase();
      const cliEmail = (cli.email || '').toLowerCase();
      const cliComp = (cli.company || '').toLowerCase();
      const cliPhone = (cli.phone || '').toLowerCase();
      const cliE164 = (cli.phoneE164 || '').toLowerCase();
      const cliRawPhone = (cli.phoneNumber || '').toLowerCase();

      return (
        fName.includes(q) ||
        lName.includes(q) ||
        fullName.includes(q) ||
        cliEmail.includes(q) ||
        cliComp.includes(q) ||
        cliPhone.includes(q) ||
        cliE164.includes(q) ||
        cliRawPhone.includes(q)
      );
    });
  }, [clients, activeFilter, searchQuery]);

  // Client selected for detailed view
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Check for any matching Gmail messages for selected client
  const clientGmailMessages = useMemo(() => {
    if (!selectedClient?.email || integrations?.gmail?.status !== 'connected') {
      return [];
    }
    const clientEmailLower = selectedClient.email.toLowerCase();
    return (integrations.gmail.messages || []).filter((msg) =>
      msg.from.toLowerCase().includes(clientEmailLower)
    );
  }, [selectedClient, integrations]);

  const deletingClientObj = clients.find((c) => c.id === deletingClientId);

  return (
    <div className="space-y-6">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2825] text-[#FAF8F5] px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-[#C5A880]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#2C2825]">
              {isNl ? 'Klanten & Relaties' : 'Clients & Relationships'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFE8DC] text-[#7A7167]">
              {clients.length}
            </span>
          </div>
          <p className="text-xs text-[#7A7167] mt-0.5">
            {isNl
              ? 'Beheer contacten, telefoonnummers en afspraken voor Mariluna.'
              : 'Manage contacts, phone numbers and relationships for Mariluna.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewClient}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>{isNl ? 'Klant Toevoegen' : 'Add Client'}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7654]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isNl ? 'Zoek klant...' : 'Search clients...'}
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#2C2825] placeholder:text-[#A49A8D] focus:outline-none focus:ring-1 focus:ring-[#8C7654] transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7654] hover:text-[#2C2825] p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#2C2825] text-white font-medium shadow-2xs'
                : 'bg-[#F2ECE3] text-[#7A7167] hover:bg-[#EAE2D3]'
            }`}
          >
            {isNl ? 'Alle klanten' : 'All clients'} ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('has_phone')}
            className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              activeFilter === 'has_phone'
                ? 'bg-[#2C2825] text-white font-medium shadow-2xs'
                : 'bg-[#F2ECE3] text-[#7A7167] hover:bg-[#EAE2D3]'
            }`}
          >
            {isNl ? 'Met telefoon' : 'With phone'} ({clients.filter((c) => c.phoneNumber || c.phone || c.phoneE164).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('has_email')}
            className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              activeFilter === 'has_email'
                ? 'bg-[#2C2825] text-white font-medium shadow-2xs'
                : 'bg-[#F2ECE3] text-[#7A7167] hover:bg-[#EAE2D3]'
            }`}
          >
            {isNl ? 'Met e-mail' : 'With email'} ({clients.filter((c) => c.email).length})
          </button>
        </div>
      </div>

      {/* Clients Display: List or Grid */}
      {filteredClients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DCD3C4] p-12 text-center space-y-3 bg-[#FAF8F3]/50">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#EFE8DC] flex items-center justify-center text-[#8C7654]">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-base text-[#2C2825]">
              {clients.length === 0
                ? isNl
                  ? 'Nog geen klanten toegevoegd.'
                  : 'No clients recorded yet.'
                : isNl
                ? 'Geen klanten gevonden met deze filter.'
                : 'No clients match your filter.'}
            </h4>
            <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
              {clients.length === 0
                ? isNl
                  ? 'Voeg je eerste klant toe om contactgegevens, telefoonnotities en afspraken overzichtelijk bij te houden.'
                  : 'Add your first client to record contact details, phone numbers, and notes.'
                : isNl
                ? 'Probeer een andere zoekterm of wis het actieve filter.'
                : 'Try adjusting your search query or reset the filter.'}
            </p>
          </div>
          {clients.length === 0 && (
            <button
              type="button"
              onClick={handleOpenNewClient}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8C7654] text-white text-xs font-medium hover:bg-[#725F42] transition shadow-xs cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? '+ Nieuwe klant toevoegen' : '+ Add new client'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((cli) => {
            const hasPhone = Boolean(cli.phoneNumber || cli.phone || cli.phoneE164);
            const displayPhone = cli.phone || (cli.phoneE164 ? formatE164ForDisplay(cli.phoneE164) : cli.phoneNumber);
            const callTarget = cli.phoneE164 || (cli.countryCode && cli.phoneNumber ? `${cli.countryCode}${cli.phoneNumber.replace(/^0+/, '')}` : cli.phoneNumber);
            const countryConfig = COUNTRY_PHONE_CODES.find((c) => c.code === cli.countryCode);

            return (
              <div
                key={cli.id}
                className="group rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#C5A880] transition p-4 space-y-3 shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedClientId(cli.id)}
                        className="text-left font-serif text-base font-medium text-[#2C2825] hover:text-[#8C7654] transition truncate block cursor-pointer"
                      >
                        {cli.firstName && cli.lastName ? `${cli.firstName} ${cli.lastName}` : cli.name}
                      </button>
                      {cli.company && (
                        <div className="text-[11px] text-[#7A7167] flex items-center gap-1 mt-0.5 truncate">
                          <Building className="w-3 h-3 text-[#8C7654] flex-shrink-0" />
                          <span className="truncate">{cli.company}</span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${
                        cli.status === 'active'
                          ? 'bg-[#E4ECE3] text-[#3D6B42]'
                          : cli.status === 'lead'
                          ? 'bg-[#F4EBE0] text-[#9A622A]'
                          : cli.status === 'completed'
                          ? 'bg-[#EAE2D3] text-[#554C42]'
                          : 'bg-[#ECE8E1] text-[#7A7167]'
                      }`}
                    >
                      {cli.status === 'active'
                        ? 'Actief'
                        : cli.status === 'lead'
                        ? 'Lead'
                        : cli.status === 'completed'
                        ? 'Afgerond'
                        : 'On hold'}
                    </span>
                  </div>

                  {/* Contact Info Badges */}
                  <div className="space-y-1.5 pt-1">
                    {/* Phone Number Display */}
                    {hasPhone ? (
                      <div className="flex items-center justify-between gap-2 bg-white/70 border border-[#EAE2D3] rounded-xl px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {countryConfig?.flag ? (
                            <span className="text-sm leading-none" role="img" aria-label={countryConfig.nameNl}>
                              {countryConfig.flag}
                            </span>
                          ) : (
                            <Phone className="w-3.5 h-3.5 text-[#8C7654] flex-shrink-0" />
                          )}
                          <span className="font-mono text-xs text-[#2C2825] truncate">
                            {displayPhone}
                          </span>
                        </div>

                        {callTarget && (
                          <a
                            href={`tel:${callTarget}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EFE8DC] hover:bg-[#8C7654] hover:text-white text-[11px] font-medium text-[#554C42] transition flex-shrink-0 cursor-pointer"
                            title={isNl ? 'Bel dit nummer' : 'Call this number'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3" />
                            <span>{isNl ? 'Bellen' : 'Call'}</span>
                          </a>
                        )}
                      </div>
                    ) : null}

                    {/* Email Display */}
                    {cli.email ? (
                      <div className="flex items-center justify-between gap-2 bg-white/70 border border-[#EAE2D3] rounded-xl px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-[#8C7654] flex-shrink-0" />
                          <span className="text-xs text-[#2C2825] truncate">{cli.email}</span>
                        </div>
                        <a
                          href={`mailto:${cli.email}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EFE8DC] hover:bg-[#8C7654] hover:text-white text-[11px] font-medium text-[#554C42] transition flex-shrink-0 cursor-pointer"
                          title={isNl ? 'Stuur e-mail' : 'Send email'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-3 h-3" />
                          <span>E-mail</span>
                        </a>
                      </div>
                    ) : null}
                  </div>

                  {/* Notes Snippet */}
                  {cli.notes && (
                    <p className="text-[11px] text-[#7A7167] line-clamp-2 italic pt-1 border-t border-[#EAE2D3]/60">
                      "{cli.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EAE2D3]">
                  <button
                    type="button"
                    onClick={() => setSelectedClientId(cli.id)}
                    className="text-[11px] text-[#8C7654] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isNl ? 'Details bekijken' : 'View details'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditClient(cli)}
                      className="p-1.5 rounded-lg text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EFE8DC] transition cursor-pointer"
                      title={isNl ? 'Bewerken' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClientId(cli.id)}
                      className="p-1.5 rounded-lg text-[#A49A8D] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                      title={isNl ? 'Verwijderen' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD / EDIT CLIENT FORM MODAL                                 */}
      {/* ============================================================ */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-[#2C2825] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#EAE2D3]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                  {editingClientId
                    ? isNl
                      ? 'Klant Bewerken'
                      : 'Edit Client'
                    : isNl
                    ? 'Nieuwe Klant'
                    : 'New Client'}
                </h3>
                <p className="text-xs text-[#7A7167] mt-0.5">
                  {isNl
                    ? 'Vul de contactgegevens in voor Mariluna.'
                    : 'Enter contact details for Mariluna.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EFE8DC] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Duplicate Warning Dialog / Banner */}
            {duplicateWarning && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 space-y-2.5 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      {duplicateWarning.type === 'email'
                        ? isNl
                          ? 'Er bestaat al een klant met dit e-mailadres.'
                          : 'A client with this email already exists.'
                        : isNl
                        ? 'Er bestaat al een klant met dit telefoonnummer.'
                        : 'A client with this phone number already exists.'}
                    </p>
                    <p className="text-[11px] text-amber-800">
                      {isNl ? 'Bestaande klant:' : 'Existing client:'}{' '}
                      <span className="font-semibold">{duplicateWarning.existingClient.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormModalOpen(false);
                      setSelectedClientId(duplicateWarning.existingClient.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-medium text-xs transition cursor-pointer"
                  >
                    {isNl ? 'Bestaande klant bekijken' : 'View existing client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveClientForm(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-medium text-xs hover:bg-amber-100 transition cursor-pointer"
                  >
                    {isNl ? 'Toch opslaan' : 'Save anyway'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="px-2.5 py-1.5 text-[11px] text-amber-800 hover:underline cursor-pointer"
                  >
                    {isNl ? 'Annuleren' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {/* Form inputs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveClientForm(false);
              }}
              className="space-y-4"
            >
              {/* Name Row: Voornaam & Achternaam (Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
                    {isNl ? 'Voornaam *' : 'First Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={isNl ? 'Bijv. Clara' : 'e.g. Clara'}
                    className={`w-full h-11 px-3.5 rounded-xl bg-white border text-xs text-[#2C2825] placeholder:text-[#A49A8D] focus:outline-none focus:ring-1 ${
                      formErrors.firstName
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-[#DDD4C5] focus:border-[#8C7654] focus:ring-[#8C7654]'
                    }`}
                  />
                  {formErrors.firstName && (
                    <p className="text-[11px] text-red-600 px-1">{formErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
                    {isNl ? 'Achternaam *' : 'Last Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={isNl ? 'Bijv. Silva' : 'e.g. Silva'}
                    className={`w-full h-11 px-3.5 rounded-xl bg-white border text-xs text-[#2C2825] placeholder:text-[#A49A8D] focus:outline-none focus:ring-1 ${
                      formErrors.lastName
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-[#DDD4C5] focus:border-[#8C7654] focus:ring-[#8C7654]'
                    }`}
                  />
                  {formErrors.lastName && (
                    <p className="text-[11px] text-red-600 px-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Company (Optional) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
                  {isNl ? 'Bedrijfsnaam (optioneel)' : 'Company name (optional)'}
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7654]" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={isNl ? 'Bijv. Studio Atelier' : 'e.g. Studio Atelier'}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#2C2825] placeholder:text-[#A49A8D] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
                  {isNl ? 'E-mailadres (optioneel)' : 'Email address (optional)'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7654]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.be"
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#2C2825] placeholder:text-[#A49A8D] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
                  />
                </div>
              </div>

              {/* Professional Phone Number Input Component */}
              <PhoneInputField
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onChangeCountryCode={setCountryCode}
                onChangePhoneNumber={setPhoneNumber}
                error={formErrors.phone}
                isNl={isNl}
              />

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
                  Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['lead', 'active', 'completed', 'on_hold'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`h-9 rounded-xl text-xs font-medium transition cursor-pointer border ${
                        status === st
                          ? 'bg-[#2C2825] text-white border-[#2C2825]'
                          : 'bg-white text-[#7A7167] border-[#DDD4C5] hover:bg-[#F5EFEB]'
                      }`}
                    >
                      {st === 'lead'
                        ? 'Lead'
                        : st === 'active'
                        ? 'Actief'
                        : st === 'completed'
                        ? 'Afgerond'
                        : 'On hold'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#7A7167]">
                  {isNl ? 'Klantnotities (optioneel)' : 'Client notes (optional)'}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isNl
                      ? 'Bijzonderheden, voorkeuren, achtergrond, contactafspraken...'
                      : 'Preferences, context, agreements...'
                  }
                  className="w-full p-3 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#2C2825] placeholder:text-[#A49A8D] focus:outline-none focus:ring-1 focus:ring-[#8C7654] resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE2D3]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE8DC] transition cursor-pointer"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer active:scale-98"
                >
                  {editingClientId
                    ? isNl
                      ? 'Wijzigingen opslaan'
                      : 'Save changes'
                    : isNl
                    ? 'Opslaan'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CLIENT DETAIL VIEW MODAL / DRAWER                            */}
      {/* ============================================================ */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-[#2C2825] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#EAE2D3]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-medium text-[#2C2825]">
                    {selectedClient.firstName && selectedClient.lastName
                      ? `${selectedClient.firstName} ${selectedClient.lastName}`
                      : selectedClient.name}
                  </h3>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${
                      selectedClient.status === 'active'
                        ? 'bg-[#E4ECE3] text-[#3D6B42]'
                        : selectedClient.status === 'lead'
                        ? 'bg-[#F4EBE0] text-[#9A622A]'
                        : selectedClient.status === 'completed'
                        ? 'bg-[#EAE2D3] text-[#554C42]'
                        : 'bg-[#ECE8E1] text-[#7A7167]'
                    }`}
                  >
                    {selectedClient.status}
                  </span>
                </div>
                {selectedClient.company && (
                  <p className="text-xs text-[#7A7167] flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>{selectedClient.company}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientId(null)}
                className="p-1.5 rounded-full text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EFE8DC] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contact Details Section */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-widest font-semibold text-[#8C7654]">
                {isNl ? 'Contactgegevens' : 'Contact Information'}
              </h4>

              <div className="space-y-2">
                {/* Phone Call Card */}
                {selectedClient.phoneNumber || selectedClient.phone || selectedClient.phoneE164 ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#EAE2D3] shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F5EFEB] flex items-center justify-center text-[#8C7654]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-[#7A7167]">
                          {isNl ? 'Telefoon / GSM' : 'Phone / Mobile'}
                        </div>
                        <div className="font-mono text-xs font-medium text-[#2C2825]">
                          {selectedClient.phone ||
                            (selectedClient.phoneE164
                              ? formatE164ForDisplay(selectedClient.phoneE164)
                              : selectedClient.phoneNumber)}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`tel:${
                        selectedClient.phoneE164 ||
                        (selectedClient.countryCode && selectedClient.phoneNumber
                          ? `${selectedClient.countryCode}${selectedClient.phoneNumber.replace(/^0+/, '')}`
                          : selectedClient.phoneNumber)
                      }`}
                      className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-white text-xs font-medium hover:bg-[#433D37] transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>{isNl ? 'Bellen' : 'Call'}</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#F5EFEB]/50 border border-dashed border-[#DDD4C5] text-xs text-[#7A7167] italic">
                    {isNl ? 'Geen telefoonnummer ingesteld.' : 'No phone number configured.'}
                  </div>
                )}

                {/* Email Card */}
                {selectedClient.email ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#EAE2D3] shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F5EFEB] flex items-center justify-center text-[#8C7654]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-[#7A7167]">E-mail</div>
                        <div className="text-xs font-medium text-[#2C2825] truncate">
                          {selectedClient.email}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="px-3 py-1.5 rounded-xl bg-[#EFE8DC] text-[#2C2825] text-xs font-medium hover:bg-[#DDD4C5] transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#8C7654]" />
                      <span>E-mail</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#F5EFEB]/50 border border-dashed border-[#DDD4C5] text-xs text-[#7A7167] italic">
                    {isNl ? 'Geen e-mailadres ingesteld.' : 'No email address configured.'}
                  </div>
                )}
              </div>
            </div>

            {/* Mariluna Gmail Integration Signal (Privacy-Safe) */}
            {clientGmailMessages.length > 0 && (
              <div className="rounded-2xl border border-[#D5C6AF] bg-[#FAF6F0] p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[#8C7654]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {clientGmailMessages.length === 1
                      ? isNl
                        ? '1 recent bericht in Mariluna Gmail'
                        : '1 recent message in Mariluna Gmail'
                      : isNl
                      ? `${clientGmailMessages.length} recente berichten in Mariluna Gmail`
                      : `${clientGmailMessages.length} recent messages in Mariluna Gmail`}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7167]">
                  {isNl
                    ? 'Mariluna Gmail herkent communicatie met dit e-mailadres. Berichten worden nooit automatisch beantwoord of verwijderd.'
                    : 'Mariluna Gmail matches messages with this email address. Messages are never sent or replied to automatically.'}
                </p>
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-widest font-semibold text-[#8C7654]">
                {isNl ? 'Klantnotities' : 'Client Notes'}
              </h4>
              <div className="p-4 rounded-2xl bg-white border border-[#EAE2D3] text-xs text-[#4A433B] whitespace-pre-wrap leading-relaxed min-h-[70px]">
                {selectedClient.notes || (
                  <span className="italic text-[#A49A8D]">
                    {isNl ? 'Nog geen notities toegevoegd voor deze klant.' : 'No notes added for this client yet.'}
                  </span>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-[11px] text-[#7A7167] pt-2 border-t border-[#EAE2D3]">
              <span>
                {isNl ? 'Klant sinds:' : 'Client since:'} {selectedClient.createdAt}
              </span>
              {selectedClient.updatedAt && (
                <span>
                  {isNl ? 'Bijgewerkt:' : 'Updated:'} {selectedClient.updatedAt.split('T')[0]}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EAE2D3]">
              <button
                type="button"
                onClick={() => {
                  setDeletingClientId(selectedClient.id);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-red-700 hover:bg-red-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isNl ? 'Klant verwijderen' : 'Delete client'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditClient(selectedClient);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-white text-xs font-medium hover:bg-[#433D37] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{isNl ? 'Bewerken' : 'Edit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClientId(null)}
                  className="px-3 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE8DC] transition cursor-pointer"
                >
                  {isNl ? 'Sluiten' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL                                    */}
      {/* ============================================================ */}
      {deletingClientId && deletingClientObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-[#2C2825]">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                {isNl ? 'Klant Verwijderen' : 'Delete Client'}
              </h3>
              <p className="text-xs text-[#7A7167]">
                {isNl
                  ? `Weet je zeker dat je ${deletingClientObj.name} wilt verwijderen?`
                  : `Are you sure you want to delete ${deletingClientObj.name}?`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClientId(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE8DC] transition cursor-pointer"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-medium hover:bg-red-800 transition shadow-xs cursor-pointer active:scale-98"
              >
                {isNl ? 'Verwijderen' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
