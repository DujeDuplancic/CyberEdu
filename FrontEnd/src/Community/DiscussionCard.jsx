import { Link } from 'react-router-dom';
import { Card, CardContent } from "../Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar";
import { Badge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { MessageSquare, Eye, Clock, Pin } from "lucide-react";

export default function DiscussionCard({ discussion }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 flex-1">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{discussion.author_name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {discussion.is_pinned && (
                  <Badge variant="secondary" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                <Badge variant="outline">{discussion.category}</Badge>
              </div>
              
              <Link to={`/community/discussion/${discussion.id}`}>
                <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                  {discussion.title}
                </h3>
              </Link>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {discussion.content}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium">{discussion.author_name}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(discussion.last_activity || discussion.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {discussion.reply_count || 0} replies
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {discussion.views || 0} views
                </span>
              </div>
            </div>
          </div>
          
          <Link to={`/community/discussion/${discussion.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}