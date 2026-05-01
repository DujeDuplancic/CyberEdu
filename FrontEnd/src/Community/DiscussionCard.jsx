import { Link } from 'react-router-dom';
import { Card, CardContent } from "../Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar";
import { Badge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { MessageSquare, Eye, Clock, Pin, ChevronRight } from "lucide-react";

export default function DiscussionCard({ discussion }) {
  // Construct avatar URL if available, otherwise use placeholder logic
  const avatarUrl = discussion.author_avatar 
    ? `http://localhost/CyberEdu/Backend/${discussion.author_avatar}` 
    : "";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-none bg-white dark:bg-slate-900/50">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Left Side: Author Identity */}
          <Avatar className="h-12 w-12 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <AvatarImage src={avatarUrl} alt={discussion.author_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {discussion.author_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Center: Discussion Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {discussion.is_pinned && (
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 border-none">
                  <Pin className="h-3 w-3 mr-1 fill-current" />
                  Pinned
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-slate-200 dark:border-slate-700">
                {discussion.category}
              </Badge>
            </div>
            
            <Link to={`/community/discussion/${discussion.id}`}>
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                {discussion.title}
              </h3>
            </Link>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-1 opacity-80">
              {discussion.content}
            </p>
            
            {/* Meta Stats */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground/80">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                @{discussion.author_name}
              </span>
              
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(discussion.last_activity || discussion.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>

              <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {discussion.reply_count || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {discussion.views || 0}
                </span>
              </div>
            </div>
          </div>
          
          {/* Right Side: Action */}
          <div className="hidden sm:flex self-center">
            <Link to={`/community/discussion/${discussion.id}`}>
              <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}