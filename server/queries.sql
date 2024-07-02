-- :name insertStuff :run
insert into stuff (tag, number) values ($tag, $number)

-- :name stuff :all
select * from stuff

-- :name me :get
select tag, min(number) "min", max(number) "max", count(distinct number) "distinct", count(number) "total" from stuff where tag = $tag
