import { authApi, endpoints } from "../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment';

/**
 * Fetches health statistics data from the health-stat API track-changes endpoint
 * @param {string} period - 'weekly', 'monthly', or 'yearly'
 * @param {Object} timeParams - Time period parameters (week, month, year) 
 * @returns {Promise<Object>} - Health statistics data
 */
export const fetchHealthStats = async (period = 'weekly', timeParams = {}) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    // Build query parameters
    let queryParams = new URLSearchParams({ period });
    
    // Get current date for comparison
    const currentDate = moment();
    let isCurrentPeriod = false;
    
    // Add period-specific time parameters
    if (timeParams.week) {
      queryParams.append('week', timeParams.week);
      
      // Determine if this is the current week
      try {
        const weekYear = timeParams.week.split('-W')[0];
        const weekNum = timeParams.week.split('-W')[1];
        isCurrentPeriod = currentDate.format('YYYY') === weekYear && 
                           currentDate.format('WW') === weekNum;
      } catch (e) {
        console.warn('Invalid week format:', timeParams.week);
      }
    } else if (timeParams.month) {
      queryParams.append('month', timeParams.month);
      isCurrentPeriod = currentDate.format('YYYY-MM') === timeParams.month;
    } else if (timeParams.year) {
      queryParams.append('year', timeParams.year);
      isCurrentPeriod = currentDate.format('YYYY') === timeParams.year;
    } else if (timeParams.date) {
      // Fallback for date object if specific parameters not provided
      const date = moment(timeParams.date);
      
      if (period === 'weekly') {
        const weekFormat = date.format('YYYY-[W]WW');
        queryParams.append('week', weekFormat);
        isCurrentPeriod = date.isSame(currentDate, 'week');
      } else if (period === 'monthly') {
        const monthFormat = date.format('YYYY-MM');
        queryParams.append('month', monthFormat);
        isCurrentPeriod = date.isSame(currentDate, 'month');
      } else if (period === 'yearly') {
        const yearFormat = date.format('YYYY');
        queryParams.append('year', yearFormat);
        isCurrentPeriod = date.isSame(currentDate, 'year');
      }
    }
    
    // Add parameter for current time period
    if (isCurrentPeriod) {
      queryParams.append('current_time_only', 'true');
    }

    const url = `${endpoints['health-stats-track-changes']}?${queryParams.toString()}`;
    console.log('Fetching health stats with URL:', url);
    
    const response = await authApi(token).get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching health statistics:', error);
    throw error;
  }
};

/**
 * Creates or updates health statistics for the current user
 * @param {Object} healthData - Health data to save
 * @returns {Promise<Object>} - Saved health data
 */
export const saveHealthStat = async (healthData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    // Create request payload with current date if not specified
    const payload = {
      ...healthData,
      date: healthData.date || new Date().toISOString().split('T')[0]
    };

    const url = endpoints['health-stats'];
    console.log('Saving health stats with data:', payload);
    
    const response = await authApi(token).post(url, payload);
    return response.data;
  } catch (error) {
    console.error('Error saving health statistics:', error);
    throw error;
  }
};

/**
 * Updates a specific health statistic record using PATCH
 * @param {number} id - ID of the health stat record to update
 * @param {Object} healthData - Health data to update
 * @returns {Promise<Object>} - Updated health data
 */
export const updateHealthStat = async (id, healthData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    if (!id) {
      throw new Error('ID không hợp lệ');
    }

    const url = `${endpoints['health-stats']}${id}/`;
    console.log(`Updating health stat ${id} with:`, healthData);
    
    const response = await authApi(token).patch(url, healthData);
    return response.data;
  } catch (error) {
    console.error('Error updating health statistics:', error);
    throw error;
  }
};

/**
 * Get the latest health statistics for the current user
 * @returns {Promise<Object>} - Latest health data
 */
export const getLatestHealthStat = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    const url = endpoints['health-stats'];
    const response = await authApi(token).get(url);
    console.log('Latest health stat response x:', response.data);
    
    // Check if response has results array
    const healthStats = response.data.results || response.data;
    console.log('Health stats array:', healthStats);
    console.log('data length:', healthStats.length);
    
    // Return the first item which should be the most recent one
    return healthStats.length > 0 ? healthStats[0] : null;
  } catch (error) {
    console.error('Error fetching latest health statistics:', error);
    throw error;
  }
};