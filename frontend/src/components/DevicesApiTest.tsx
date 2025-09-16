import React, { useState } from 'react';
import { useDevices, useCreateDevice, useDeviceStats } from '../hooks/useDevices';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { DeviceCreateData } from '../api';

interface DevicesApiTestProps {
  className?: string;
}

export const DevicesApiTest: React.FC<DevicesApiTestProps> = ({ className }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<DeviceCreateData>({
    name: '',
    brand: '',
    model: '',
    description: '',
    status: 'active',
  });

  // Use hooks for devices data
  const { data: devicesResponse, isLoading, error, refetch } = useDevices(1, 10);
  const { data: statsResponse, isLoading: statsLoading } = useDeviceStats();
  const createDeviceMutation = useCreateDevice();

  const devices = devicesResponse?.data || [];
  const stats = statsResponse?.data;

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createDeviceMutation.mutateAsync(formData);
      setFormData({
        name: '',
        brand: '',
        model: '',
        description: '',
        status: 'active',
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create device:', error);
    }
  };

  const handleInputChange = (field: keyof DeviceCreateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Тест API устройств</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Обновить'}
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={createDeviceMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить устройство
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статистика устройств</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Всего</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Активных</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                <div className="text-sm text-muted-foreground">Неактивных</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
                <div className="text-sm text-muted-foreground">На обслуживании</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Создание нового устройства</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Бренд*</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Модель*</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                      handleInputChange('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Активное</SelectItem>
                      <SelectItem value="inactive">Неактивное</SelectItem>
                      <SelectItem value="maintenance">На обслуживании</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createDeviceMutation.isPending}
                >
                  {createDeviceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Создать устройство
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Список устройств</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-medium text-red-900">Ошибка загрузки устройств</div>
                <div className="text-sm text-red-700">
                  {error instanceof Error ? error.message : 'Неизвестная ошибка'}
                </div>
              </div>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Загрузка устройств...' : 'Устройства не найдены'}
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {device.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {device.brand} {device.model}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={device.status === 'active' ? 'default' : 'secondary'}
                    >
                      {device.status === 'active' ? 'Активное' : 
                       device.status === 'maintenance' ? 'Обслуживание' : 'Неактивное'}
                    </Badge>
                    {device.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mutation Status */}
      {createDeviceMutation.isError && (
        <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <div className="font-medium text-red-900">Ошибка создания устройства</div>
            <div className="text-sm text-red-700">
              {createDeviceMutation.error instanceof Error 
                ? createDeviceMutation.error.message 
                : 'Неизвестная ошибка'}
            </div>
          </div>
        </div>
      )}

      {createDeviceMutation.isSuccess && (
        <div className="flex items-center gap-2 p-4 border border-green-200 rounded-lg bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div className="font-medium text-green-900">
            Устройство успешно создано!
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesApiTest;
