'use client'

import { useState } from 'react'
import { MapPin, TrendingUp, BarChart3 } from 'lucide-react'

export default function AvailabilityZones() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Availability Heatmaps</h3>
          <p className="text-gray-400">
            Visualize player availability patterns across different time zones and schedules
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-12 text-center">
        <div className="flex justify-center mb-4">
          <MapPin className="w-16 h-16 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Availability Visualization
        </h3>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          This feature will provide interactive heatmaps showing when players are most available,
          helping you schedule optimal tryout times based on player responses.
        </p>
        
        {/* Feature List */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-dark border border-gray-800 rounded-lg p-4">
            <MapPin className="w-8 h-8 text-primary mb-2 mx-auto" />
            <h4 className="text-sm font-semibold text-white mb-1">Zone Mapping</h4>
            <p className="text-xs text-gray-400">
              Visualize availability by geographic zones
            </p>
          </div>
          <div className="bg-dark border border-gray-800 rounded-lg p-4">
            <TrendingUp className="w-8 h-8 text-primary mb-2 mx-auto" />
            <h4 className="text-sm font-semibold text-white mb-1">Peak Times</h4>
            <p className="text-xs text-gray-400">
              Identify optimal scheduling windows
            </p>
          </div>
          <div className="bg-dark border border-gray-800 rounded-lg p-4">
            <BarChart3 className="w-8 h-8 text-primary mb-2 mx-auto" />
            <h4 className="text-sm font-semibold text-white mb-1">Analytics</h4>
            <p className="text-xs text-gray-400">
              Track attendance and availability patterns
            </p>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Feature in development • Contact developer for implementation
        </div>
      </div>
    </div>
  )
}

