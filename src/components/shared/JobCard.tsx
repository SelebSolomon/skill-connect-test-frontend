import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, Briefcase } from 'lucide-react';
import { Card } from '../ui/Card';
import { jobStatusBadge } from '../ui/Badge';
import { format } from 'date-fns';
import type { Job, Service } from '../../types';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const service = job.serviceId as Service | undefined;
  const serviceName = typeof service === 'object' ? service?.name : 'Uncategorized';

  return (
    <Link to={`/jobs/${job._id}`} className="block h-full">
      <Card hover className="h-full flex flex-col gap-4 group">
        {job.imageUrl && (
          <div className="overflow-hidden rounded-xl -mx-2 -mt-2">
            <img
              src={job.imageUrl}
              alt={job.title}
              className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base leading-tight group-hover:text-blue-700 transition-colors">
              {job.title}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium mt-0.5">
              <Briefcase className="w-3 h-3" />
              {serviceName}
            </span>
          </div>
          {jobStatusBadge(job.status)}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{job.description}</p>

        <div className="mt-auto pt-3 border-t border-gray-50 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
          {job.budget != null && (
            <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
              <DollarSign className="w-3.5 h-3.5" />
              ₦{job.budget.toLocaleString()}
            </span>
          )}
          {job.jobLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {job.jobLocation}
            </span>
          )}
          {job.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(job.createdAt), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
