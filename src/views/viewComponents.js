import NotificationsView from './administration/NotificationsView.vue';
import ServicesView from './administration/ServicesView.vue';
import SettingsView from './administration/SettingsView.vue';
import UsersView from './administration/UsersView.vue';
import OwnerAgendaView from './agenda/OwnerAgendaView.vue';
import PersonalAgendaView from './agenda/PersonalAgendaView.vue';
import LoginView from './auth/LoginView.vue';
import RecoveryView from './auth/RecoveryView.vue';
import SetupView from './auth/SetupView.vue';
import CatalogView from './catalog/CatalogView.vue';
import DailyHistoryView from './clinical/DailyHistoryView.vue';
import WaitingRoomView from './clinical/WaitingRoomView.vue';
import HomeView from './home/HomeView.vue';
import NoticesView from './notices/NoticesView.vue';
import OwnerProfileView from './people/OwnerProfileView.vue';
import OwnersView from './people/OwnersView.vue';
import VeterinariansView from './people/VeterinariansView.vue';
import VetProfileView from './people/VetProfileView.vue';
import PetProfileView from './pets/PetProfileView.vue';
import PetsView from './pets/PetsView.vue';
import RemindersView from './reminders/RemindersView.vue';
import OwnerSchedulesView from './schedules/OwnerSchedulesView.vue';
import SchedulesView from './schedules/SchedulesView.vue';
import AgendaDaySection from '../components/agenda/AgendaDaySection.vue';
import AgendaEntryCard from '../components/agenda/AgendaEntryCard.vue';
import AgendaNoteForm from '../components/agenda/AgendaNoteForm.vue';
import OwnerReminderForm from '../components/agenda/OwnerReminderForm.vue';
import AttentionForm from '../components/clinical/AttentionForm.vue';
import ClinicalForm from '../components/clinical/ClinicalForm.vue';
import ClinicalHistoryPrint from '../components/clinical/ClinicalHistoryPrint.vue';
import ClinicalRecordCard from '../components/clinical/ClinicalRecordCard.vue';
import MedicationRow from '../components/clinical/MedicationRow.vue';
import ClinicFields from '../components/forms/ClinicFields.vue';
import EntityForm from '../components/forms/EntityForm.vue';
import InlineOwnerForm from '../components/forms/InlineOwnerForm.vue';
import ResetPasswordForm from '../components/forms/ResetPasswordForm.vue';
import HomePendingTickets from '../components/home/HomePendingTickets.vue';
import HomeWaitingPatients from '../components/home/HomeWaitingPatients.vue';
import EntryReasonDialog from '../components/identification/EntryReasonDialog.vue';
import PetQrDialog from '../components/identification/PetQrDialog.vue';
import PublicPetDialog from '../components/identification/PublicPetDialog.vue';
import QrScanDialog from '../components/identification/QrScanDialog.vue';
import QrSymbol from '../components/identification/QrSymbol.vue';
import ScanResultDialog from '../components/identification/ScanResultDialog.vue';
import ApplicationShell from '../components/layout/ApplicationShell.vue';
import AuthLayout from '../components/layout/AuthLayout.vue';
import PetCard from '../components/pets/PetCard.vue';
import PetImage from '../components/pets/PetImage.vue';
import PetImagePicker from '../components/pets/PetImagePicker.vue';
import ScheduleTable from '../components/schedules/ScheduleTable.vue';
import AppIcon from '../components/shared/AppIcon.vue';
import ConfirmationDialog from '../components/shared/ConfirmationDialog.vue';
import ModalFrame from '../components/shared/ModalFrame.vue';
import Pagination from '../components/shared/Pagination.vue';
import RecordListLayout from '../components/shared/RecordListLayout.vue';
import StatusBadge from '../components/shared/StatusBadge.vue';
import ToastMessage from '../components/shared/ToastMessage.vue';
import ChargeMedicationRow from '../components/tickets/ChargeMedicationRow.vue';
import ChargeTicketForm from '../components/tickets/ChargeTicketForm.vue';
import TicketReceipt from '../components/tickets/TicketReceipt.vue';

export const viewComponents = {
  NotificationsView,
  ServicesView,
  SettingsView,
  UsersView,
  OwnerAgendaView,
  PersonalAgendaView,
  LoginView,
  RecoveryView,
  SetupView,
  CatalogView,
  DailyHistoryView,
  WaitingRoomView,
  HomeView,
  NoticesView,
  OwnerProfileView,
  OwnersView,
  VeterinariansView,
  VetProfileView,
  PetProfileView,
  PetsView,
  RemindersView,
  OwnerSchedulesView,
  SchedulesView,
  AgendaDaySection,
  AgendaEntryCard,
  AgendaNoteForm,
  OwnerReminderForm,
  AttentionForm,
  ClinicalForm,
  ClinicalHistoryPrint,
  ClinicalRecordCard,
  MedicationRow,
  ClinicFields,
  EntityForm,
  InlineOwnerForm,
  ResetPasswordForm,
  HomePendingTickets,
  HomeWaitingPatients,
  EntryReasonDialog,
  PetQrDialog,
  PublicPetDialog,
  QrScanDialog,
  QrSymbol,
  ScanResultDialog,
  ApplicationShell,
  AuthLayout,
  PetCard,
  PetImage,
  PetImagePicker,
  ScheduleTable,
  AppIcon,
  ConfirmationDialog,
  ModalFrame,
  Pagination,
  RecordListLayout,
  StatusBadge,
  ToastMessage,
  ChargeMedicationRow,
  ChargeTicketForm,
  TicketReceipt
};
