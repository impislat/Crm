import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  Badge
} from '@mui/material';
import {
  UserPlus,
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
  Scale,
  Calendar,
  Edit,
  Trash2,
  MapPin,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Upload,
  Download,
  Plus,
  Megaphone,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { format, parseISO, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast, Toaster } from 'sonner';
import { motion } from 'motion/react';

type ClientStatus = 'new' | 'in_progress' | 'waiting' | 'silent' | 'completed' | 'rejected';
type ServiceType = 'consultation' | 'documents' | 'representation' | 'other';

interface Client {
  id: string;
  name: string;
  city: string;
  service: ServiceType;
  customService?: string;
  status: ClientStatus;
  amount?: number;
  paid?: boolean;
  deadline?: string;
  createdAt: string;
  lastContact?: string;
  notes: string;
}

interface AdStats {
  id: string;
  city: string;
  title: string;
  history: Array<{
    date: string;
    views: number;
    contacts: number;
  }>;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  city?: string;
}

const STORAGE_KEY = 'crm_data';

const statusConfig: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Новый лид', color: '#1976d2', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  in_progress: { label: 'В работе', color: '#ed6c02', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  waiting: { label: 'Жду ответа', color: '#9c27b0', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  silent: { label: 'Молчун', color: '#757575', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  completed: { label: 'Завершен', color: '#2e7d32', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  rejected: { label: 'Отказ', color: '#d32f2f', bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
};

const serviceConfig: Record<ServiceType, string> = {
  consultation: 'Консультация',
  documents: 'Документы',
  representation: 'Представительство',
  other: 'Другое'
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
  }
  return null;
};

const saveToStorage = (data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Ошибка сохранения данных:', e);
  }
};

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);
const MotionTableRow = motion.create(TableRow);

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [adStats, setAdStats] = useState<AdStats[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setClients(saved.clients || []);
      setAdStats(saved.adStats || []);
      setTransactions(saved.transactions || []);
    }
  }, []);

  useEffect(() => {
    saveToStorage({ clients, adStats, transactions });
  }, [clients, adStats, transactions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const today = startOfDay(new Date());
      const overdueClients = clients.filter(c => {
        if (!c.deadline || c.status === 'completed' || c.status === 'rejected') return false;
        const deadlineDate = startOfDay(parseISO(c.deadline));
        return isBefore(deadlineDate, today);
      });

      overdueClients.forEach(client => {
        toast.error(`Дедлайн истек: ${client.name} (${client.city})`, {
          duration: 10000,
          action: {
            label: 'Открыть',
            onClick: () => setActiveTab(0)
          }
        });
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [clients, setActiveTab]);

  const handleExport = () => {
    const data = { clients, adStats, transactions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Данные экспортированы');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.clients) setClients(data.clients);
        if (data.adStats) setAdStats(data.adStats);
        if (data.transactions) setTransactions(data.transactions);
        toast.success('Данные импортированы');
      } catch {
        toast.error('Ошибка импорта данных');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const overdueCount = useMemo(() => {
    const today = startOfDay(new Date());
    return clients.filter(c => {
      if (!c.deadline || c.status === 'completed' || c.status === 'rejected') return false;
      const deadlineDate = startOfDay(parseISO(c.deadline));
      return isBefore(deadlineDate, today);
    }).length;
  }, [clients]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        py: 4
      }}>
        <Container maxWidth="xl">
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                  CRM Авито
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Юридические услуги
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                  startIcon={<Upload size={20} />}
                  component="label"
                >
                  Импорт
                  <input type="file" hidden accept=".json" onChange={handleImport} />
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                  startIcon={<Download size={20} />}
                  onClick={handleExport}
                >
                  Экспорт
                </Button>
              </Stack>
            </Stack>
          </MotionBox>

          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem' }
              }}
            >
              <Tab
                label={
                  <Badge badgeContent={overdueCount} color="error">
                    Клиенты
                  </Badge>
                }
              />
              <Tab label="Объявления" />
              <Tab label="Финансы" />
            </Tabs>
          </MotionCard>

          {activeTab === 0 && (
            <ClientsTab
              clients={clients}
              setClients={setClients}
              adStats={adStats}
            />
          )}
          {activeTab === 1 && (
            <AdvertisementsTab
              adStats={adStats}
              setAdStats={setAdStats}
              clients={clients}
            />
          )}
          {activeTab === 2 && (
            <FinanceTab
              transactions={transactions}
              setTransactions={setTransactions}
              clients={clients}
              adStats={adStats}
            />
          )}
        </Container>
      </Box>
    </>
  );
}

// Вкладка Клиенты
interface ClientsTabProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  adStats: AdStats[];
}

function ClientsTab({ clients, setClients, adStats }: ClientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const cities = useMemo(() => {
    const citySet = new Set(adStats.map(ad => ad.city));
    return Array.from(citySet).sort();
  }, [adStats]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesCity = cityFilter === 'all' || client.city === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    }).sort((a, b) => {
      if (a.deadline && b.deadline) {
        return startOfDay(parseISO(a.deadline)).getTime() - startOfDay(parseISO(b.deadline)).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  }, [clients, searchQuery, statusFilter, cityFilter]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      total: clients.length,
      inProgress: clients.filter(c => c.status === 'in_progress').length,
      waiting: clients.filter(c => c.status === 'waiting').length,
      silent: clients.filter(c => c.status === 'silent').length,
      completed: clients.filter(c => c.status === 'completed').length,
      overdue: clients.filter(c => {
        if (!c.deadline || c.status === 'completed' || c.status === 'rejected') return false;
        const deadlineDate = startOfDay(parseISO(c.deadline));
        return isBefore(deadlineDate, today);
      }).length
    };
  }, [clients]);

  const handleSave = (clientData: Partial<Client>) => {
    if (selectedClient) {
      setClients(clients.map(c => c.id === selectedClient.id ? { ...c, ...clientData } : c));
      toast.success('Клиент обновлен');
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        name: clientData.name || '',
        city: clientData.city || '',
        service: clientData.service || 'consultation',
        customService: clientData.customService,
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: clientData.notes || '',
        amount: clientData.amount
      };
      setClients([newClient, ...clients]);
      toast.success('Клиент добавлен');
    }
    setOpenDialog(false);
  };

  const handleDelete = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    toast.success('Клиент удален');
  };

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Всего', value: stats.total, icon: Users, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { label: 'В работе', value: stats.inProgress, icon: Clock, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
          { label: 'Жду ответа', value: stats.waiting, icon: MessageCircle, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          { label: 'Молчуны', value: stats.silent, icon: XCircle, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
          { label: 'Завершено', value: stats.completed, icon: CheckCircle, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
          { label: 'Просрочено', value: stats.overdue, icon: AlertCircle, gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' }
        ].map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 2 }} key={stat.label}>
            <MotionCard
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              sx={{
                background: stat.gradient,
                color: 'white',
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <stat.icon size={32} />
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{stat.label}</Typography>
                </Stack>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {stats.overdue > 0 && (
        <MotionCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          sx={{ mb: 3, borderRadius: 3 }}
        >
          <Alert severity="error" icon={<AlertCircle />}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              У вас {stats.overdue} {stats.overdue === 1 ? 'просроченный дедлайн' : 'просроченных дедлайна'}!
            </Typography>
          </Alert>
        </MotionCard>
      )}

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        sx={{ borderRadius: 3 }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  startAdornment: <Search size={20} style={{ marginRight: 8, color: '#666' }} />
                }
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Статус</InputLabel>
              <Select value={statusFilter} label="Статус" onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}>
                <MenuItem value="all">Все</MenuItem>
                {Object.entries(statusConfig).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Город</InputLabel>
              <Select value={cityFilter} label="Город" onChange={(e) => setCityFilter(e.target.value)}>
                <MenuItem value="all">Все</MenuItem>
                {cities.map(city => <MenuItem key={city} value={city}>{city}</MenuItem>)}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<UserPlus size={20} />}
              onClick={() => { setSelectedClient(null); setOpenDialog(true); }}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600
              }}
            >
              Добавить
            </Button>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Клиент</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Город</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Услуга</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Сумма</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Дедлайн</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.map((client, idx) => {
                  const deadlineDate = client.deadline ? startOfDay(parseISO(client.deadline)) : null;
                  const today = startOfDay(new Date());

                  const isOverdue = deadlineDate &&
                    client.status !== 'completed' &&
                    client.status !== 'rejected' &&
                    isBefore(deadlineDate, today);

                  const daysLeft = deadlineDate ? differenceInCalendarDays(deadlineDate, today) : null;

                  return (
                    <MotionTableRow
                      key={client.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      sx={{ cursor: 'pointer' }}
                      hover
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(client.createdAt), 'd MMM yyyy', { locale: ru })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MapPin size={14} />
                          <Typography variant="body2">{client.city}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {client.service === 'other' && client.customService
                            ? client.customService
                            : serviceConfig[client.service]}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig[client.status].label}
                          size="small"
                          sx={{
                            background: statusConfig[client.status].bg,
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {client.amount ? (
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: client.paid ? '#2e7d32' : '#ed6c02' }}>
                              {client.amount.toLocaleString('ru-RU')} ₽
                            </Typography>
                            <Chip
                              label={client.paid ? 'Оплачено' : 'Не оплачено'}
                              size="small"
                              sx={{
                                bgcolor: client.paid ? '#e8f5e9' : '#fff4e5',
                                color: client.paid ? '#2e7d32' : '#ed6c02',
                                fontWeight: 600,
                                height: 20,
                                fontSize: '0.7rem'
                              }}
                            />
                          </Stack>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {client.deadline ? (
                          <Stack spacing={0.5}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: isOverdue ? '#d32f2f' : daysLeft !== null && daysLeft <= 2 ? '#ed6c02' : 'inherit'
                              }}
                            >
                              {format(parseISO(client.deadline), 'd MMM yyyy', { locale: ru })}
                            </Typography>
                            {daysLeft !== null && (
                              <Typography variant="caption" sx={{ color: isOverdue ? '#d32f2f' : '#666' }}>
                                {isOverdue ? `Просрочено на ${Math.abs(daysLeft)} дн.` : daysLeft === 0 ? 'Сегодня!' : `Осталось ${daysLeft} дн.`}
                              </Typography>
                            )}
                          </Stack>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => { setSelectedClient(client); setOpenDialog(true); }}>
                            <Edit size={18} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(client.id)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </MotionTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredClients.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Users size={64} style={{ color: '#ccc', marginBottom: 16 }} />
              <Typography variant="body1" color="text.secondary">Клиенты не найдены</Typography>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      <ClientDialog
        open={openDialog}
        client={selectedClient}
        cities={cities}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
      />
    </>
  );
}

// Диалог клиента
interface ClientDialogProps {
  open: boolean;
  client: Client | null;
  cities: string[];
  onClose: () => void;
  onSave: (data: Partial<Client>) => void;
}

function ClientDialog({ open, client, cities, onClose, onSave }: ClientDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    service: 'consultation' as ServiceType,
    customService: '',
    status: 'new' as ClientStatus,
    amount: '',
    paid: false,
    deadline: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          name: client.name,
          city: client.city,
          service: client.service,
          customService: client.customService || '',
          status: client.status,
          amount: client.amount?.toString() || '',
          paid: client.paid || false,
          deadline: client.deadline || '',
          notes: client.notes
        });
      } else {
        setFormData({
          name: '',
          city: cities[0] || '',
          service: 'consultation',
          customService: '',
          status: 'new',
          amount: '',
          paid: false,
          deadline: '',
          notes: ''
        });
      }
    }
  }, [open, client, cities]);

  const handleSubmit = () => {
    if (!formData.name || !formData.city) {
      toast.error('Заполните обязательные поля');
      return;
    }

    onSave({
      ...formData,
      amount: formData.amount ? parseInt(formData.amount) : undefined,
      paid: formData.paid,
      deadline: formData.deadline || undefined
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{client ? 'Редактировать' : 'Новый клиент'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="ФИО клиента"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Город</InputLabel>
            <Select
              value={formData.city}
              label="Город"
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            >
              {cities.map(city => <MenuItem key={city} value={city}>{city}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Услуга</InputLabel>
            <Select
              value={formData.service}
              label="Услуга"
              onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceType })}
            >
              {Object.entries(serviceConfig).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.service === 'other' && (
            <TextField
              label="Своя услуга"
              value={formData.customService}
              onChange={(e) => setFormData({ ...formData, customService: e.target.value })}
              fullWidth
              placeholder="Введите название услуги"
            />
          )}

          {client && (
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={formData.status}
                label="Статус"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Сумма договора (₽)"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/\D/g, '') })}
            fullWidth
            helperText="Укажите сумму по договору"
          />

          <Stack direction="row" alignItems="center" spacing={2} sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: formData.paid ? '#e8f5e9' : '#fff4e5',
            border: '1px solid',
            borderColor: formData.paid ? '#2e7d32' : '#ed6c02'
          }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Статус оплаты
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formData.paid ? 'Деньги получены, учтены в доходах' : 'Оплата ожидается, не учтено в доходах'}
              </Typography>
            </Box>
            <Button
              variant={formData.paid ? 'outlined' : 'contained'}
              size="small"
              onClick={() => setFormData({ ...formData, paid: !formData.paid })}
              sx={{
                background: formData.paid ? 'transparent' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: formData.paid ? '#2e7d32' : 'white',
                borderColor: formData.paid ? '#2e7d32' : 'transparent',
                fontWeight: 600,
                minWidth: 120
              }}
            >
              {formData.paid ? 'Оплачено ✓' : 'Не оплачено'}
            </Button>
          </Stack>

          <TextField
            label="Дедлайн"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Уведомление придет когда наступит дедлайн"
          />

          <TextField
            label="Заметки"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600
          }}
        >
          {client ? 'Сохранить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Вкладка Объявления
interface AdvertisementsTabProps {
  adStats: AdStats[];
  setAdStats: (ads: AdStats[]) => void;
  clients: Client[];
}

function AdvertisementsTab({ adStats, setAdStats, clients }: AdvertisementsTabProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdStats | null>(null);

  const enrichedStats = useMemo(() => {
    return adStats.map(ad => {
      const cityClients = clients.filter(c => c.city === ad.city);
      const revenue = cityClients.reduce((sum, c) => sum + (c.paid ? (c.amount || 0) : 0), 0);

      const sortedHistory = [...ad.history].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const latestData = sortedHistory[sortedHistory.length - 1] || { views: 0, contacts: 0 };
      const prevData = sortedHistory[sortedHistory.length - 2] || latestData;

      const viewsChange = latestData.views - prevData.views;
      const contactsChange = latestData.contacts - prevData.contacts;

      const conversionRate = latestData.views > 0
        ? ((latestData.contacts / latestData.views) * 100).toFixed(1)
        : '0.0';

      const clientConversionRate = latestData.contacts > 0
        ? ((cityClients.length / latestData.contacts) * 100).toFixed(1)
        : '0.0';

      return {
        ...ad,
        clients: cityClients.length,
        revenue,
        totalViews: latestData.views,
        totalContacts: latestData.contacts,
        viewsChange,
        contactsChange,
        conversionRate: parseFloat(conversionRate),
        clientConversionRate: parseFloat(clientConversionRate)
      };
    });
  }, [adStats, clients]);

  const handleSave = (adData: Partial<AdStats> & { views?: number; contacts?: number }) => {
    if (selectedAd) {
      if (adData.views !== undefined && adData.contacts !== undefined) {
        const newHistory = [
          ...selectedAd.history,
          {
            date: new Date().toISOString(),
            views: adData.views,
            contacts: adData.contacts
          }
        ];
        setAdStats(adStats.map(a => a.id === selectedAd.id
          ? { ...a, title: adData.title || a.title, history: newHistory }
          : a
        ));
      } else {
        setAdStats(adStats.map(a => a.id === selectedAd.id ? { ...a, ...adData } : a));
      }
      toast.success('Объявление обновлено');
    } else {
      const newAd: AdStats = {
        id: Date.now().toString(),
        city: adData.city || '',
        title: adData.title || '',
        history: adData.views !== undefined && adData.contacts !== undefined
          ? [{
              date: new Date().toISOString(),
              views: adData.views,
              contacts: adData.contacts
            }]
          : [],
        createdAt: new Date().toISOString()
      };
      setAdStats([...adStats, newAd]);
      toast.success('Объявление добавлено');
    }
    setOpenDialog(false);
  };

  const handleDelete = (id: string) => {
    setAdStats(adStats.filter(a => a.id !== id));
    toast.success('Объявление удалено');
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          Объявления и статистика
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: '#667eea',
            fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
          }}
          startIcon={<Plus size={20} />}
          onClick={() => { setSelectedAd(null); setOpenDialog(true); }}
        >
          Добавить
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {enrichedStats.map((ad, idx) => {
          const getTrendIcon = (change: number) => {
            if (change > 0) return <ArrowUp size={16} />;
            if (change < 0) return <ArrowDown size={16} />;
            return <Minus size={16} />;
          };

          const getTrendColor = (change: number) => {
            if (change > 0) return '#2e7d32';
            if (change < 0) return '#d32f2f';
            return '#757575';
          };

          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ad.id}>
              <MotionCard
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <MapPin size={20} style={{ color: '#667eea' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{ad.city}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{ad.title}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => { setSelectedAd(ad); setOpenDialog(true); }}>
                        <Edit size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(ad.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Stack spacing={2}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>Общий доход</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {ad.revenue.toLocaleString()} ₽
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {ad.clients} {ad.clients === 1 ? 'клиент' : 'клиентов'}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Просмотры</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {ad.totalViews.toLocaleString()}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Box sx={{ color: getTrendColor(ad.viewsChange) }}>
                            {getTrendIcon(ad.viewsChange)}
                          </Box>
                          <Typography variant="caption" sx={{ color: getTrendColor(ad.viewsChange), fontWeight: 600 }}>
                            {ad.viewsChange > 0 ? '+' : ''}{ad.viewsChange}
                          </Typography>
                        </Stack>
                      </Box>

                      <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Контакты</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {ad.totalContacts.toLocaleString()}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Box sx={{ color: getTrendColor(ad.contactsChange) }}>
                            {getTrendIcon(ad.contactsChange)}
                          </Box>
                          <Typography variant="caption" sx={{ color: getTrendColor(ad.contactsChange), fontWeight: 600 }}>
                            {ad.contactsChange > 0 ? '+' : ''}{ad.contactsChange}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Конверсия в контакт</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                          {ad.conversionRate}%
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Конверсия в клиента</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#764ba2' }}>
                          {ad.clientConversionRate}%
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>
          );
        })}
      </Grid>

      {adStats.length === 0 && (
        <MotionCard
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ borderRadius: 3, bgcolor: 'white' }}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Megaphone size={64} style={{ color: '#ccc', marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>Нет объявлений</Typography>
              <Typography variant="body2" color="text.secondary">Добавьте первое объявление и начните отслеживать статистику</Typography>
            </Box>
          </CardContent>
        </MotionCard>
      )}

      <AdDialog
        open={openDialog}
        ad={selectedAd}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
      />
    </>
  );
}

// Диалог объявления
interface AdDialogProps {
  open: boolean;
  ad: AdStats | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

function AdDialog({ open, ad, onClose, onSave }: AdDialogProps) {
  const [formData, setFormData] = useState({
    city: '',
    title: '',
    views: '',
    contacts: ''
  });

  useEffect(() => {
    if (open) {
      if (ad) {
        const latest = ad.history[ad.history.length - 1];
        setFormData({
          city: ad.city,
          title: ad.title,
          views: latest ? latest.views.toString() : '0',
          contacts: latest ? latest.contacts.toString() : '0'
        });
      } else {
        setFormData({ city: '', title: '', views: '0', contacts: '0' });
      }
    }
  }, [open, ad]);

  const handleSubmit = () => {
    if (!formData.city || !formData.title) {
      toast.error('Заполните обязательные поля');
      return;
    }

    onSave({
      city: formData.city,
      title: formData.title,
      views: parseInt(formData.views) || 0,
      contacts: parseInt(formData.contacts) || 0
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {ad ? 'Обновить статистику объявления' : 'Новое объявление'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Город"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            fullWidth
            required
            disabled={!!ad}
          />
          <TextField
            label="Название объявления"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Просмотры"
            value={formData.views}
            onChange={(e) => setFormData({ ...formData, views: e.target.value.replace(/\D/g, '') })}
            fullWidth
            type="text"
            helperText={ad ? 'Текущее значение из Авито' : 'Начальное значение'}
          />
          <TextField
            label="Контакты"
            value={formData.contacts}
            onChange={(e) => setFormData({ ...formData, contacts: e.target.value.replace(/\D/g, '') })}
            fullWidth
            type="text"
            helperText={ad ? 'Текущее значение из Авито' : 'Начальное значение'}
          />
          {ad && (
            <Alert severity="info">
              Введите актуальные значения из Авито. Система автоматически рассчитает динамику.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600
          }}
        >
          {ad ? 'Обновить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Вкладка Финансы
interface FinanceTabProps {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  clients: Client[];
  adStats: AdStats[];
}

function FinanceTab({ transactions, setTransactions, clients, adStats }: FinanceTabProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const stats = useMemo(() => {
    const income = clients.reduce((sum, c) => sum + (c.paid ? (c.amount || 0) : 0), 0);
    const expense = transactions.reduce((s, t) => s + t.amount, 0);
    const pending = clients.reduce((sum, c) => sum + (!c.paid ? (c.amount || 0) : 0), 0);
    return { income, expense, balance: income - expense, pending };
  }, [clients, transactions]);

  const cityStats = useMemo(() => {
    const statsMap = new Map<string, { income: number; expense: number; clients: number; pending: number }>();

    clients.forEach(client => {
      if (!statsMap.has(client.city)) {
        statsMap.set(client.city, { income: 0, expense: 0, clients: 0, pending: 0 });
      }
      const s = statsMap.get(client.city)!;
      if (client.paid) {
        s.income += client.amount || 0;
      } else {
        s.pending += client.amount || 0;
      }
      s.clients += 1;
    });

    transactions.forEach(tx => {
      if (tx.city) {
        if (!statsMap.has(tx.city)) {
          statsMap.set(tx.city, { income: 0, expense: 0, clients: 0 });
        }
        const s = statsMap.get(tx.city)!;
        s.expense += tx.amount;
      }
    });

    return Array.from(statsMap.entries())
      .map(([city, data]) => ({
        city,
        income: data.income,
        expense: data.expense,
        pending: data.pending,
        clients: data.clients,
        profit: data.income - data.expense
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [clients, transactions]);

  const handleSave = (txData: Partial<Transaction>) => {
    if (selectedTx) {
      setTransactions(transactions.map(t => t.id === selectedTx.id ? { ...t, ...txData } as Transaction : t));
      toast.success('Расход обновлен');
    } else {
      const newTx: Transaction = {
        id: Date.now().toString(),
        type: 'expense',
        amount: txData.amount || 0,
        category: txData.category || '',
        description: txData.description || '',
        date: new Date().toISOString(),
        city: txData.city
      };
      setTransactions([newTx, ...transactions]);
      toast.success('Расход добавлен');
    }
    setOpenDialog(false);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success('Расход удален');
  };

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Оплачено', value: stats.income, icon: TrendingUp, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#fff' },
          { label: 'Ожидается', value: stats.pending, icon: Clock, gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', color: '#fff' },
          { label: 'Расходы', value: stats.expense, icon: TrendingDown, gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', color: '#fff' },
          { label: 'Чистая прибыль', value: stats.balance, icon: DollarSign, gradient: stats.balance >= 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', color: '#fff' }
        ].map((stat, idx) => (
          <Grid size={{ xs: 12, md: 3 }} key={stat.label}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              sx={{
                background: stat.gradient,
                color: stat.color,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                    <stat.icon size={32} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {stat.value.toLocaleString()} ₽
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{stat.label}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        sx={{ mb: 3, borderRadius: 3 }}
      >
        <CardContent>
          <Alert severity="info">
            Доходы считаются только с оплаченных клиентов. "Ожидается" - это суммы договоров, которые еще не оплачены. Здесь добавляйте только расходы.
          </Alert>
        </CardContent>
      </MotionCard>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        sx={{ mb: 3, borderRadius: 3 }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Прибыль по городам</Typography>
          <Grid container spacing={2}>
            {cityStats.map((stat, idx) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={stat.city}>
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                >
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    background: stat.profit >= 0
                      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                      : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    color: 'white'
                  }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <MapPin size={18} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{stat.city}</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Прибыль: {stat.profit.toLocaleString()} ₽
                    </Typography>
                    <Stack spacing={0.5} sx={{ opacity: 0.9 }}>
                      <Typography variant="caption">
                        ✓ Оплачено: {stat.income.toLocaleString()} ₽
                      </Typography>
                      <Typography variant="caption">
                        ⏱ Ожидается: {stat.pending.toLocaleString()} ₽
                      </Typography>
                      <Typography variant="caption">
                        ✗ Расход: {stat.expense.toLocaleString()} ₽
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 0.5 }}>
                        👥 {stat.clients} {stat.clients === 1 ? 'клиент' : 'клиентов'}
                      </Typography>
                    </Stack>
                  </Box>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </MotionCard>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        sx={{ borderRadius: 3 }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Расходы</Typography>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600
              }}
              startIcon={<Plus size={20} />}
              onClick={() => { setSelectedTx(null); setOpenDialog(true); }}
            >
              Добавить расход
            </Button>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Дата</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Категория</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Описание</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Город</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Сумма</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx, idx) => (
                  <MotionTableRow
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    hover
                  >
                    <TableCell>{format(new Date(tx.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.category}
                        size="small"
                        sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>{tx.city || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                      -{tx.amount.toLocaleString()} ₽
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => { setSelectedTx(tx); setOpenDialog(true); }}>
                          <Edit size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(tx.id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </MotionTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {transactions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <DollarSign size={64} style={{ color: '#ccc', marginBottom: 16 }} />
              <Typography variant="body1" color="text.secondary">Нет расходов</Typography>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      <TransactionDialog
        open={openDialog}
        transaction={selectedTx}
        cities={adStats.map(a => a.city)}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
      />
    </>
  );
}

// Диалог транзакции
interface TransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  cities: string[];
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => void;
}

function TransactionDialog({ open, transaction, cities, onClose, onSave }: TransactionDialogProps) {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    city: ''
  });

  useEffect(() => {
    if (open) {
      if (transaction) {
        setFormData({
          amount: transaction.amount.toString(),
          category: transaction.category,
          description: transaction.description,
          city: transaction.city || ''
        });
      } else {
        setFormData({ amount: '', category: '', description: '', city: '' });
      }
    }
  }, [open, transaction]);

  const handleSubmit = () => {
    if (!formData.amount || !formData.category) {
      toast.error('Заполните обязательные поля');
      return;
    }

    onSave({
      type: 'expense',
      amount: parseInt(formData.amount),
      category: formData.category,
      description: formData.description,
      city: formData.city || undefined
    });
  };

  const commonCategories = [
    'Реклама на Авито',
    'Аренда офиса',
    'Коммунальные услуги',
    'Налоги',
    'Канцтовары',
    'Связь и интернет',
    'Транспортные расходы',
    'Другое'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {transaction ? 'Редактировать расход' : 'Новый расход'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Сумма (₽)"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/\D/g, '') })}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Категория</InputLabel>
            <Select
              value={formData.category}
              label="Категория"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {commonCategories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            placeholder="Детали расхода..."
          />

          <FormControl fullWidth>
            <InputLabel>Город (опционально)</InputLabel>
            <Select
              value={formData.city}
              label="Город (опционально)"
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            >
              <MenuItem value="">Не указан</MenuItem>
              {cities.map(city => <MenuItem key={city} value={city}>{city}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600
          }}
        >
          {transaction ? 'Сохранить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}