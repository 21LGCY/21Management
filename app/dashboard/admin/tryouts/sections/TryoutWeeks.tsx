'use client'

import { useState } from 'react'
import { Calendar, Plus, Users, Clock } from 'lucide-react'

export default function TryoutWeeks() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Tryout Weeks Management</h3>
            <p className="text-gray-400">
              Create tryout weeks and manage player availability responses
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
            <Plus className="w-4 h-4" />
            Create Tryout Week
          </button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-12 text-center">
        <div className="flex justify-center mb-4">
          <Calendar className="w-16 h-16 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Tryout Scheduling System
        </h3>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          This feature will allow you to create tryout weeks, send availability forms to players,
          and track their responses with a visual calendar interface.
        </p>
        
        {/* Feature List */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-dark border border-gray-800 rounded-lg p-4">
            <Calendar className="w-8 h-8 text-primary mb-2 mx-auto" />
            <h4 className="text-sm font-semibold text-white mb-1">Week Planning</h4>
            <p className="text-xs text-gray-400">
              Create and schedule tryout weeks for different teams
            </p>
          </div>
          <div className="bg-dark border border-gray-800 rounded-lg p-4">
            <Users className="w-8 h-8 text-primary mb-2 mx-auto" />
            <h4 className="text-sm font-semibold text-white mb-1">Invite Players</h4>
            <p className="text-xs text-gray-400">
              Send availability forms to selected players
            </p>
          </div>
          <div className="bg-dark border border-gray-800 rounded-lg p-4">
            <Clock className="w-8 h-8 text-primary mb-2 mx-auto" />
            <h4 className="text-sm font-semibold text-white mb-1">Track Responses</h4>
            <p className="text-xs text-gray-400">
              View who has submitted their availability
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
